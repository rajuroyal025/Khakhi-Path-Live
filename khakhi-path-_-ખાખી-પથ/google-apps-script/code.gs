/**
 * KHAKHI PATH - Google Apps Script Backend
 * Deploy this as a Web App with "Execute as: Me" and "Who has access: Anyone"
 * (Security is handled via the API Key/Token handshake from the React app)
 */

const FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE'; // Replace with your folder ID
const CONFIG_FILE_NAME = 'content.json';

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  try {
    if (action === 'updateContent') {
      return ContentService.createTextOutput(JSON.stringify(updateContentJson(data.payload)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'getContent') {
      return ContentService.createTextOutput(JSON.stringify(getContentJson()))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getContentJson() {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFilesByName(CONFIG_FILE_NAME);
    
    if (files.hasNext()) {
      const file = files.next();
      return JSON.parse(file.getBlob().getDataAsString());
    }
  } catch (e) {
    console.error("Error in getContentJson:", e);
  }
  return { lastUpdated: new Date(), items: [], notifications: [] };
}

function updateContentJson(payload) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(CONFIG_FILE_NAME);
  
  let file;
  if (files.hasNext()) {
    file = files.next();
    file.setContent(JSON.stringify(payload, null, 2));
  } else {
    file = folder.createFile(CONFIG_FILE_NAME, JSON.stringify(payload, null, 2), MimeType.JSON);
  }
  
  return { success: true, fileId: file.getId() };
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getContent') {
      return ContentService.createTextOutput(JSON.stringify(getContentJson()))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput("Khakhi Path API is Active. Use action=getContent to fetch data.");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
