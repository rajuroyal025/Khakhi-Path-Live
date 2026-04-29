import { Question, Test } from './types';

export const mockQuestions: Question[] = [
  {
    id: '1',
    text: 'ભારતીય બંધારણમાં કુલ કેટલા મૂળભૂત અધિકારો છે?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 1,
    subject: 'ભારતનું બંધારણ',
    topic: 'મૂળભૂત અધિકારો',
    difficulty: 'easy'
  },
  {
    id: '2',
    text: 'ભારતના રાષ્ટ્રપતિની ચૂંટણી કેવી રીતે થાય છે?',
    options: ['પ્રત્યક્ષ ચૂંટણી', 'પરોક્ષ ચૂંટણી', 'નોમિનેશન', 'વારસાગત'],
    correctAnswer: 1,
    subject: 'ભારતનું બંધારણ',
    topic: 'રાષ્ટ્રપતિ',
    difficulty: 'medium'
  },
  {
    id: '3',
    text: 'ગુજરાતની રાજધાની શું છે?',
    options: ['અમદાવાદ', 'સુરત', 'ગાંધીનગર', 'રાજકોટ'],
    correctAnswer: 2,
    subject: 'ભૂગોળ',
    topic: 'ગુજરાત',
    difficulty: 'easy'
  },
  {
    id: '4',
    text: 'ભારતની સૌથી લાંબી નદી કઈ છે?',
    options: ['ગંગા', 'યમુના', 'બ્રહ્મપુત્ર', 'ગોદાવરી'],
    correctAnswer: 0,
    subject: 'ભૂગોળ',
    topic: 'ભારતની નદીઓ',
    difficulty: 'easy'
  },
  {
    id: '5',
    text: '1947માં ભારતને સ્વતંત્રતા ક્યારે મળી?',
    options: ['15 ઓગસ્ટ 1947', '26 જાન્યુઆરી 1947', '2 ઓક્ટોબર 1947', '15 ઓગસ્ટ 1950'],
    correctAnswer: 0,
    subject: 'ઇતિહાસ',
    topic: 'ભારતની આઝાદી',
    difficulty: 'easy'
  },
  {
    id: '6',
    text: 'ગુજરાતની રચના ક્યારે થઈ?',
    options: ['1 મે 1960', '15 ઓગસ્ટ 1947', '26 જાન્યુઆરી 1950', '1 નવેમ્બર 1956'],
    correctAnswer: 0,
    subject: 'ઇતિહાસ',
    topic: 'ગુજરાત રાજ્ય',
    difficulty: 'medium'
  },
  {
    id: '7',
    text: 'પાણીનું રાસાયણિક સૂત્ર શું છે?',
    options: ['H2O', 'CO2', 'O2', 'H2O2'],
    correctAnswer: 0,
    subject: 'સામાન્ય વિજ્ઞાન',
    topic: 'રસાયણશાસ્ત્ર',
    difficulty: 'easy'
  },
  {
    id: '8',
    text: 'પૃથ્વી પર ગુરુત્વાકર્ષણ બળ લગભગ કેટલું છે?',
    options: ['9.8 m/s²', '10 m/s²', '8.9 m/s²', '11 m/s²'],
    correctAnswer: 0,
    subject: 'સામાન્ય વિજ્ઞાન',
    topic: 'ભૌતિકશાસ્ત્ર',
    difficulty: 'medium'
  },
  {
    id: '9',
    text: 'ભારતના પ્રથમ વડાપ્રધાન કોણ હતા?',
    options: ['સરદાર પટેલ', 'જવાહરલાલ નેહરુ', 'મહાત્મા ગાંધી', 'ડો. આંબેડકર'],
    correctAnswer: 1,
    subject: 'ઇતિહાસ',
    topic: 'સ્વતંત્ર ભારત',
    difficulty: 'easy'
  },
  {
    id: '10',
    text: 'કમ્પ્યુટરનો મગજ કોને કહેવામાં આવે છે?',
    options: ['RAM', 'Hard Disk', 'CPU', 'Monitor'],
    correctAnswer: 2,
    subject: 'સામાન્ય વિજ્ઞાન',
    topic: 'કમ્પ્યુટર',
    difficulty: 'easy'
  },
  {
    id: '11',
    text: 'ગુજરાતનો સૌથી મોટો જિલ્લો કયો છે?',
    options: ['કચ્છ', 'બનાસકાંઠા', 'અમદાવાદ', 'જામનગર'],
    correctAnswer: 0,
    subject: 'ભૂગોળ',
    topic: 'ગુજરાત',
    difficulty: 'easy'
  },
  {
    id: '12',
    text: 'ભારતનું રાષ્ટ્રીય પ્રાણી કયું છે?',
    options: ['સિંહ', 'વાઘ', 'હાથી', 'ચિત્તો'],
    correctAnswer: 1,
    subject: 'સામાન્ય જ્ઞાન',
    topic: 'ભારત',
    difficulty: 'easy'
  },
  {
    id: '13',
    text: 'સૂર્યમંડળનો સૌથી મોટો ગ્રહ કયો છે?',
    options: ['પૃથ્વી', 'મંગળ', 'ગુરુ', 'શનિ'],
    correctAnswer: 2,
    subject: 'સામાન્ય વિજ્ઞાન',
    topic: 'ખગોળશાસ્ત્ર',
    difficulty: 'easy'
  },
  {
    id: '14',
    text: 'ભારતનું રાષ્ટ્રીય ગીત "જન ગણ મન" કોણે લખ્યું છે?',
    options: ['બંકિમચંદ્ર ચેટર્જી', 'રવીન્દ્રનાથ ટાગોર', 'મહાત્મા ગાંધી', 'સરોજિની નાયડુ'],
    correctAnswer: 1,
    subject: 'ઇતિહાસ',
    topic: 'રાષ્ટ્રીય પ્રતીકો',
    difficulty: 'easy'
  },
  {
    id: '15',
    text: 'ગુજરાતની સૌથી લાંબી નદી કઈ છે?',
    options: ['તાપી', 'મહી', 'નર્મદા', 'સાબરમતી'],
    correctAnswer: 2,
    subject: 'ભૂગોળ',
    topic: 'ગુજરાતની નદીઓ',
    difficulty: 'easy'
  },
  {
    id: '16',
    text: 'વિશ્વ પર્યાવરણ દિવસ ક્યારે ઉજવવામાં આવે છે?',
    options: ['5 જૂન', '10 ડિસેમ્બર', '2 ઓક્ટોબર', '15 ઓગસ્ટ'],
    correctAnswer: 0,
    subject: 'સામાન્ય જ્ઞાન',
    topic: 'દિવસો',
    difficulty: 'easy'
  },
  {
    id: '17',
    text: 'ભારતની પ્રથમ મહિલા વડાપ્રધાન કોણ હતા?',
    options: ['સરોજિની નાયડુ', 'ઇન્દિરા ગાંધી', 'પ્રતિભા પાટીલ', 'સુષ્મા સ્વરાજ'],
    correctAnswer: 1,
    subject: 'ઇતિહાસ',
    topic: 'મહિલાઓ',
    difficulty: 'easy'
  },
  {
    id: '18',
    text: 'કયા વિટામિનની ઉણપથી રતાંધળાપણું થાય છે?',
    options: ['વિટામિન A', 'વિટામિન B', 'વિટામિન C', 'વિટામિન D'],
    correctAnswer: 0,
    subject: 'સામાન્ય વિજ્ઞાન',
    topic: 'જીવવિજ્ઞાન',
    difficulty: 'easy'
  },
  {
    id: '19',
    text: 'ભારતનું બંધારણ ક્યારે અમલમાં આવ્યું?',
    options: ['15 ઓગસ્ટ 1947', '26 જાન્યુઆરી 1950', '2 ઓક્ટોબર 1948', '15 ઓગસ્ટ 1950'],
    correctAnswer: 1,
    subject: 'ભારતનું બંધારણ',
    topic: 'અમલીકરણ',
    difficulty: 'easy'
  },
  {
    id: '20',
    text: 'ગુજરાતનો દરિયાકિનારો કેટલો લાંબો છે?',
    options: ['1600 કિમી', '1200 કિમી', '1000 કિમી', '2000 કિમી'],
    correctAnswer: 0,
    subject: 'ભૂગોળ',
    topic: 'ગુજરાત',
    difficulty: 'easy'
  },
  {
    id: '21',
    text: 'ભારતનું ક્ષેત્રફળની દ્રષ્ટિએ વિશ્વમાં કયું સ્થાન છે?',
    options: ['પાંચમું', 'સાતમું', 'નવમું', 'દસમું'],
    correctAnswer: 1,
    subject: 'ભૂગોળ',
    topic: 'ભારત',
    difficulty: 'easy'
  },
  {
    id: '22',
    text: 'ગીર રાષ્ટ્રીય ઉદ્યાન કયા પ્રાણી માટે જાણીતું છે?',
    options: ['વાઘ', 'સિંહ', 'હાથી', 'ગેંડો'],
    correctAnswer: 1,
    subject: 'સામાન્ય જ્ઞાન',
    topic: 'ગુજરાત',
    difficulty: 'easy'
  },
  {
    id: '23',
    text: 'ભારતની મધ્યમાંથી કયું વૃત્ત પસાર થાય છે?',
    options: ['વિષુવવૃત્ત', 'મકરવૃત્ત', 'કર્કવૃત્ત', 'ધ્રુવવૃત્ત'],
    correctAnswer: 2,
    subject: 'ભૂગોળ',
    topic: 'ભારત',
    difficulty: 'easy'
  },
  {
    id: '24',
    text: 'સ્ટેચ્યુ ઓફ યુનિટી કઈ નદીના કિનારે આવેલું છે?',
    options: ['તાપી', 'મહી', 'નર્મદા', 'સાબરમતી'],
    correctAnswer: 2,
    subject: 'સામાન્ય જ્ઞાન',
    topic: 'ગુજરાત',
    difficulty: 'easy'
  },
  {
    id: '25',
    text: 'ભારતનું રાષ્ટ્રીય ફૂલ કયું છે?',
    options: ['ગુલાબ', 'કમળ', 'ગલગોટો', 'સૂર્યમુખી'],
    correctAnswer: 1,
    subject: 'સામાન્ય જ્ઞાન',
    topic: 'ભારત',
    difficulty: 'easy'
  }
];

export const dailyTest: Test = {
  id: 'daily-1',
  title: 'દૈનિક ટેસ્ટ - ' + new Date().toLocaleDateString('gu-IN'),
  description: 'આજના મહત્વના પ્રશ્નોની પ્રેક્ટિસ કરો.',
  questions: mockQuestions,
  durationMinutes: 20,
  totalMarks: mockQuestions.length
};

export const subjects = [
  { name: 'રીઝનીંગ', icon: 'Brain', color: 'bg-indigo-500' },
  { name: 'ભૂગોળ', icon: 'Map', color: 'bg-blue-500' },
  { name: 'ગણિત', icon: 'Calculator', color: 'bg-red-500' },
  { name: 'comprehension', icon: 'BookOpen', color: 'bg-cyan-500' },
  { name: 'કરંટ અફેર્સ', icon: 'Newspaper', color: 'bg-orange-500' },
  { name: 'વિજ્ઞાન', icon: 'FlaskConical', color: 'bg-green-500' },
  { name: 'ઇતિહાસ', icon: 'History', color: 'bg-amber-500' },
  { name: 'ભારતનું બંધારણ', icon: 'BookOpen', color: 'bg-red-600' },
  { name: 'સાંસ્કૃતિક વારસો', icon: 'Map', color: 'bg-amber-600' },
  { name: 'સામાન્ય જ્ઞાન', icon: 'Lightbulb', color: 'bg-yellow-500' }
];
