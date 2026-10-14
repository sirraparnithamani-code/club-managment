/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - CLUB DATA
 * Centralized club data for the Explore Clubs page
 * ==========================================================================
 */

const CLUB_DATA = [
  {
    id: 'coding-club',
    name: 'Coding Club',
    category: 'Technical',
    description: 'Explore programming, software development, problem-solving and technology.',
    icon: '💻',
    members: '140+',
    featured: true
  },
  {
    id: 'serene-club',
    name: 'The Serene Club',
    category: 'Personal Development',
    description: 'A community focused on creativity, relaxation, positive experiences and student connection.',
    icon: '🌿',
    members: '80+',
    featured: false
  },
  {
    id: 'comedy-talks-club',
    name: 'Comedy Talks Club',
    category: 'Entertainment & Performing Arts',
    description: 'A space for students interested in comedy, conversations, humor and entertainment.',
    icon: '🎭',
    members: '65+',
    featured: false
  },
  {
    id: 'photography-club',
    name: 'Photography Club',
    category: 'Media & Communication',
    description: 'Explore photography, visual storytelling, composition and creative expression.',
    icon: '📷',
    members: '120+',
    featured: true
  },
  {
    id: 'social-eco-friendly-club',
    name: 'Social Eco-Friendly Club',
    category: 'Social Service',
    description: 'A community focused on social awareness, environmental responsibility and sustainability.',
    icon: '🌱',
    members: '95+',
    featured: false
  },
  {
    id: 'arts-craft-cultural-club',
    name: 'Arts - Craft and Cultural Club',
    category: 'Arts & Culture',
    description: 'Explore arts, crafts, cultural expression and creative activities.',
    icon: '🎨',
    members: '110+',
    featured: false
  },
  {
    id: 'japanese-club',
    name: 'Japanese Club',
    category: 'Language & Culture',
    description: 'Discover Japanese language, culture, traditions and cultural exchange.',
    icon: '🗾',
    members: '75+',
    featured: false
  },
  {
    id: 'penlighten-club',
    name: 'Penlighten Club',
    category: 'Arts & Culture',
    description: 'A creative space for writing, literature, ideas and sharing perspectives.',
    icon: '✍️',
    members: '55+',
    featured: false
  },
  {
    id: 'sports-club',
    name: 'Sports Club',
    category: 'Sports & Fitness',
    description: 'Participate in sports, physical activities, teamwork and fitness.',
    icon: '⚽',
    members: '200+',
    featured: true
  },
  {
    id: 'short-film-club',
    name: 'Short Film Club',
    category: 'Media & Communication',
    description: 'Explore filmmaking, storytelling, acting, cinematography and film production.',
    icon: '🎬',
    members: '70+',
    featured: false
  },
  {
    id: 'speak-3d',
    name: 'Speak 3D',
    category: 'Personal Development',
    description: 'Develop communication, public speaking, presentation and interpersonal skills.',
    icon: '📐',
    members: '90+',
    featured: false
  },
  {
    id: 'hitband',
    name: 'Hitband',
    category: 'Entertainment & Performing Arts',
    description: 'A community for students interested in music, singing, instruments and performances.',
    icon: '🎸',
    members: '85+',
    featured: true
  },
  {
    id: 'youth-for-seva',
    name: 'Youth for Seva',
    category: 'Social Service',
    description: 'Encourages student participation in volunteering, social service and community activities.',
    icon: '🤝',
    members: '130+',
    featured: false
  },
  {
    id: 'sculpture-club',
    name: 'Sculpture Club',
    category: 'Arts & Culture',
    description: 'Explore sculpture, three-dimensional art, modelling and hands-on creativity.',
    icon: '🗿',
    members: '45+',
    featured: false
  },
  {
    id: 'rehash-club',
    name: 'Rehash Club',
    category: 'Other',
    description: 'A space for creative ideas, experimentation, collaboration and new perspectives.',
    icon: '♻️',
    members: '40+',
    featured: false
  },
  {
    id: 'podcast-club',
    name: 'Podcast Club',
    category: 'Media & Communication',
    description: 'Explore podcasting, interviews, discussions, audio storytelling and content creation.',
    icon: '🎙️',
    members: '60+',
    featured: false
  },
  {
    id: 'fashify-club',
    name: 'Fashify Club',
    category: 'Arts & Culture',
    description: 'Explore fashion, styling, design, trends and creative self-expression.',
    icon: '👗',
    members: '50+',
    featured: false
  },
  {
    id: 'self-defense',
    name: 'Self Defense',
    category: 'Sports & Fitness',
    description: 'Explore self-defense awareness, physical preparedness, confidence and safety skills.',
    icon: '🥋',
    members: '80+',
    featured: false
  },
  {
    id: 'korean-club',
    name: 'Korean Club',
    category: 'Language & Culture',
    description: 'Discover Korean language, culture, traditions and cultural exchange.',
    icon: '🇰🇷',
    members: '70+',
    featured: false
  },
  {
    id: 'lets-nacho',
    name: 'Let\'s Nacho',
    category: 'Entertainment & Performing Arts',
    description: 'A community for dance, choreography, performances and creative movement.',
    icon: '💃',
    members: '100+',
    featured: false
  },
  {
    id: 'hackathon-club',
    name: 'Hackathon Club',
    category: 'Technical',
    description: 'Explore hackathons, problem-solving, technology, teamwork and innovative projects.',
    icon: '⚡',
    members: '110+',
    featured: true
  },
  {
    id: 'nss-club',
    name: 'NSS Club',
    category: 'Social Service',
    description: 'A community focused on volunteering, social responsibility and community service.',
    icon: '🏛️',
    members: '150+',
    featured: false
  },
  {
    id: 'ncc-club',
    name: 'NCC Club',
    category: 'Sports & Fitness',
    description: 'Develop leadership, discipline, teamwork, physical fitness and responsible citizenship.',
    icon: '🎖️',
    members: '120+',
    featured: false
  },
  {
    id: 'minds-club',
    name: 'Minds Club',
    category: 'Personal Development',
    description: 'A community for ideas, knowledge sharing, discussions and personal development.',
    icon: '💡',
    members: '65+',
    featured: false
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All', count: CLUB_DATA.length },
  { id: 'technical', label: 'Technical', count: CLUB_DATA.filter(c => c.category === 'Technical').length },
  { id: 'arts-culture', label: 'Arts & Culture', count: CLUB_DATA.filter(c => c.category === 'Arts & Culture').length },
  { id: 'sports-fitness', label: 'Sports & Fitness', count: CLUB_DATA.filter(c => c.category === 'Sports & Fitness').length },
  { id: 'language-culture', label: 'Language & Culture', count: CLUB_DATA.filter(c => c.category === 'Language & Culture').length },
  { id: 'media-communication', label: 'Media & Communication', count: CLUB_DATA.filter(c => c.category === 'Media & Communication').length },
  { id: 'social-service', label: 'Social Service', count: CLUB_DATA.filter(c => c.category === 'Social Service').length },
  { id: 'entertainment-performing-arts', label: 'Entertainment & Performing Arts', count: CLUB_DATA.filter(c => c.category === 'Entertainment & Performing Arts').length },
  { id: 'personal-development', label: 'Personal Development', count: CLUB_DATA.filter(c => c.category === 'Personal Development').length },
  { id: 'other', label: 'Other', count: CLUB_DATA.filter(c => c.category === 'Other').length }
];

const CATEGORY_BADGE_STYLES = {
  'Technical': { bg: '#E6DCEC', text: '#5A3F6B', border: 'rgba(125, 91, 144, 0.30)' },
  'Arts & Culture': { bg: '#EFE1D8', text: '#6E4A3C', border: 'rgba(184, 152, 139, 0.45)' },
  'Sports & Fitness': { bg: '#DEE4D8', text: '#4F6047', border: 'rgba(126, 156, 126, 0.40)' },
  'Language & Culture': { bg: '#EDE5F0', text: '#5A3F6B', border: 'rgba(125, 91, 144, 0.24)' },
  'Media & Communication': { bg: '#EFE1D8', text: '#6E4A3C', border: 'rgba(184, 152, 139, 0.45)' },
  'Social Service': { bg: '#DEE4D8', text: '#4F6047', border: 'rgba(126, 156, 126, 0.40)' },
  'Entertainment & Performing Arts': { bg: '#EADCE9', text: '#5F3A55', border: 'rgba(125, 91, 144, 0.26)' },
  'Personal Development': { bg: '#E6DCEC', text: '#5A3F6B', border: 'rgba(125, 91, 144, 0.30)' },
  'Other': { bg: '#EFE9E3', text: '#6B5449', border: '#E2D8CF' }
};

/**
 * Extended detail content for the Club Details page.
 * Keyed by club id. Only fields that can be honestly derived from the club
 * definition live here — the rest of the page renders conditionally.
 *
 * `dayOffset` is relative to today so sample events always read as upcoming.
 */
const CLUB_DETAILS = {
  'coding-club': {
    established: null,
    purpose: 'Build practical programming ability and a habit of solving real problems, alongside students who are starting at the same level.',
    activities: ['Weekly code labs', 'Build-a-thon sprints', 'Algorithm practice', 'Open-source contributions'],
    learn: ['Programming fundamentals', 'Version control and Git', 'Debugging and code review', 'Team-based project workflow'],
    meeting: { day: 'Every Wednesday', time: '5:00 PM - 7:00 PM', location: 'Computer Lab B, Block C' },
    events: [
      { name: 'Intro to Programming Bootcamp', dayOffset: 9, time: '4:00 PM - 7:00 PM', location: 'Computer Lab B', description: 'A three-day starter workshop covering variables, control flow and functions.' },
      { name: 'Mini Hack: Build Something Small', dayOffset: 24, time: '9:00 AM - 6:00 PM', location: 'Innovation Hub', description: 'A one-day team sprint to ship a small working project and demo it.' },
      { name: 'Code Review Clinic', dayOffset: 38, time: '5:00 PM - 6:30 PM', location: 'Computer Lab B', description: 'Bring your code and get structured feedback from club mentors.' }
    ]
  },
  'serene-club': {
    purpose: 'Create a calm, welcoming space where students can slow down, make things and build genuine friendships outside of coursework.',
    activities: ['Guided relaxation sessions', 'Creative journaling circles', 'Nature walks on campus', 'Open community meetups'],
    learn: ['Mindfulness and stress management', 'Expressive writing', 'Active listening', 'Group facilitation'],
    meeting: { day: 'Every Friday', time: '4:00 PM - 5:30 PM', location: 'Wellness Room, Student Center' },
    events: [
      { name: 'Morning Calm Session', dayOffset: 6, time: '8:00 AM - 9:00 AM', location: 'Campus Garden', description: 'A quiet start to the day with light stretching and guided breathing.' },
      { name: 'Journaling Circle', dayOffset: 19, time: '4:00 PM - 5:30 PM', location: 'Wellness Room', description: 'Prompt-led writing session. No sharing required, all experience levels welcome.' }
    ]
  },
  'comedy-talks-club': {
    purpose: 'Give students a low-pressure stage to try stand-up, sketch and storytelling, and to learn that failing in front of friends is part of the craft.',
    activities: ['Open mic nights', 'Improv warm-ups', 'Stand-up writing workshops', 'Impromptu battles'],
    learn: ['Comedic timing and delivery', 'Improv basics', 'Joke structure', 'Stage confidence'],
    meeting: { day: 'Every Tuesday', time: '6:00 PM - 8:00 PM', location: 'Auditorium B, Arts Block' },
    events: [
      { name: 'Open Mic Night', dayOffset: 11, time: '6:00 PM - 8:30 PM', location: 'Auditorium B', description: 'Five-minute slots for comedy, music or storytelling. Sign-up at the door.' },
      { name: 'Improv Jam Session', dayOffset: 27, time: '5:00 PM - 7:00 PM', location: 'Seminar Room 3', description: 'Drop-in improv games and scene work for beginners and regulars alike.' }
    ]
  },
  'photography-club': {
    purpose: 'Build a community of students interested in the craft of images, from first camera handling to portfolio-level personal projects.',
    activities: ['Photo walks on campus', 'Editing and post-processing labs', 'Themed photo challenges', 'Portfolio reviews'],
    learn: ['Composition and framing', 'Manual camera controls', 'Lighting fundamentals', 'Photo editing workflows'],
    meeting: { day: 'Every Thursday', time: '4:00 PM - 6:00 PM', location: 'Design Studio, Arts Block' },
    events: [
      { name: 'Golden Hour Photo Walk', dayOffset: 4, time: '4:30 PM - 6:30 PM', location: 'Campus Quad', description: 'Bring any camera and practise shooting in natural evening light.' },
      { name: 'Editing Lab: Colour Correction', dayOffset: 22, time: '5:00 PM - 7:00 PM', location: 'Design Studio', description: 'A hands-on session on colour grading, presets and a consistent look.' },
      { name: 'Student Photography Exhibition', dayOffset: 40, time: '4:00 PM - 8:00 PM', location: 'Library Atrium', description: 'Selected club work is exhibited publicly. Guests and family welcome.' }
    ]
  },
  'social-eco-friendly-club': {
    purpose: 'Turn environmental concern into organised student action on campus and in the surrounding community.',
    activities: ['Campus clean-up drives', 'Sustainability awareness drives', 'Recycling and waste audits', 'Peer-to-peer learning sessions'],
    learn: ['Waste management and recycling', 'Carbon footprint basics', 'Sustainable campus living', 'Community organising'],
    meeting: { day: 'Every Saturday', time: '10:00 AM - 12:00 PM', location: 'Environmental Science Lab 1' },
    events: [
      { name: 'Campus Clean-Up Drive', dayOffset: 8, time: '7:00 AM - 10:00 AM', location: 'Main Campus Grounds', description: 'Gloves and bags provided. Teams collect, sort and record waste data.' },
      { name: 'Eco Talk: Low-Waste Living', dayOffset: 25, time: '2:00 PM - 3:30 PM', location: 'Seminar Hall 2', description: 'A practical talk on reducing waste in hostel and home life.' }
    ]
  },
  'arts-craft-cultural-club': {
    purpose: 'Preserve and celebrate student craft traditions while giving everyone space to work with their hands and materials.',
    activities: ['Folk art and craft sessions', 'Live craft demonstrations', 'Cultural celebration events', 'Collaborative craft projects'],
    learn: ['Traditional craft techniques', 'Material selection and handling', 'Cultural storytelling', 'Pattern and motif design'],
    meeting: { day: 'Every Monday', time: '3:00 PM - 5:00 PM', location: 'Craft Studio, Arts Block' },
    events: [
      { name: 'Folk Art Demonstration', dayOffset: 13, time: '3:00 PM - 5:00 PM', location: 'Craft Studio', description: 'A visiting artisan demonstrates regional craft techniques and takes questions.' },
      { name: 'Cultural Week Showcase', dayOffset: 35, time: '11:00 AM - 6:00 PM', location: 'Open Courtyard', description: 'Student work, food stalls and performances representing the culture of the club.' }
    ]
  },
  'japanese-club': {
    purpose: 'Introduce Japanese language, culture and everyday customs through friendly, beginner-friendly study circles and cultural events.',
    activities: ['Language practice circles', 'Anime and manga discussion', 'Kanji and calligraphy sessions', 'Cultural film screenings'],
    learn: ['Basic Japanese grammar and vocabulary', 'Hiragana and katakana', 'Japanese pop culture context', 'Everyday conversational phrases'],
    meeting: { day: 'Every Wednesday', time: '4:00 PM - 6:00 PM', location: 'Language Lab 3' },
    events: [
      { name: 'Hiragana Beginner Workshop', dayOffset: 10, time: '4:00 PM - 6:00 PM', location: 'Language Lab 3', description: 'Start from zero. Learn to read and write the first Japanese scripts.' },
      { name: 'Japanese Film Screening', dayOffset: 29, time: '7:00 PM - 9:00 PM', location: 'Media Room 1', description: 'A short film with English subtitles and a short discussion afterwards.' }
    ]
  },
  'penlighten-club': {
    purpose: 'Give writers a serious, supportive readership and a reason to keep writing every week.',
    activities: ['Weekly writing prompts', 'Open critique sessions', 'Collaborative story projects', 'Reading circles'],
    learn: ['Fiction structure', 'Editing and revision', 'Voice and style', 'Giving constructive feedback'],
    meeting: { day: 'Every Thursday', time: '5:00 PM - 6:30 PM', location: 'Library Seminar Room 2' },
    events: [
      { name: 'Open Mic Reading Night', dayOffset: 12, time: '6:00 PM - 8:00 PM', location: 'Library Seminar Room 2', description: 'Read your own work aloud. Nothing is edited or judged, only appreciated.' },
      { name: 'Short Story Workshop', dayOffset: 31, time: '4:00 PM - 6:00 PM', location: 'Library Seminar Room 2', description: 'A guided workshop on building tension across a single scene.' }
    ]
  },
  'sports-club': {
    purpose: 'Keep students physically active and connected through recreational sport, regular training and inter-college competition.',
    activities: ['Morning fitness sessions', 'Friendly inter-college matches', 'Tournament preparation', 'Team selection trials'],
    learn: ['Warm-up and injury prevention', 'Team tactics and positioning', 'Fitness planning', 'Sportsmanship and fair play'],
    meeting: { day: 'Monday, Wednesday, Friday', time: '6:00 AM - 8:00 AM', location: 'Main Sports Complex' },
    events: [
      { name: 'Inter-College Football Trial', dayOffset: 7, time: '7:00 AM - 11:00 AM', location: 'Main Ground', description: 'Open selection trials. Bring indoor shoes, water and a valid college ID.' },
      { name: 'Intra-Club Athletics Meet', dayOffset: 21, time: '8:00 AM - 1:00 PM', location: 'Sports Complex', description: 'Track and field events across all age groups, with house team points.' }
    ]
  },
  'short-film-club': {
    purpose: 'Walk students through an actual production cycle, from script and storyboard to edit, score and screen.',
    activities: ['Screenwriting workshops', 'Storyboarding sessions', 'Weekend shoot days', 'Rough-cut screening reviews'],
    learn: ['Screenwriting structure', 'Storyboarding and shot planning', 'Basic camera operation', 'Editing and post-production'],
    meeting: { day: 'Every Tuesday', time: '5:00 PM - 7:00 PM', location: 'Media Lab 2' },
    events: [
      { name: 'Screenwriting Roundtable', dayOffset: 9, time: '5:00 PM - 7:00 PM', location: 'Media Lab 2', description: 'Bring a one-page logline. The group helps you find the story inside it.' },
      { name: '48-Hour Film Sprint', dayOffset: 26, time: '9:00 AM - 9:00 PM', location: 'Media Lab and Campus', description: 'Write, shoot and cut a short film in two days. Teams of up to five.' }
    ]
  },
  'speak-3d': {
    purpose: 'Turn quiet students into confident speakers who can present an idea clearly in an interview, a seminar or a meeting.',
    activities: ['Public speaking workshops', 'Mock interview practice', 'Group discussions and debates', 'Pitch and presentation clinics'],
    learn: ['Speech structure and delivery', 'Voice modulation', 'Answering questions under pressure', 'Slide and visual aids design'],
    meeting: { day: 'Every Friday', time: '4:00 PM - 6:00 PM', location: 'Seminar Hall 4' },
    events: [
      { name: 'Mock Interview Marathon', dayOffset: 11, time: '9:00 AM - 1:00 PM', location: 'Seminar Hall 4', description: 'Rotating interview panels with instant feedback for every participant.' },
      { name: 'Three-Minute Pitch Contest', dayOffset: 30, time: '3:00 PM - 5:30 PM', location: 'Auditorium B', description: 'Pick any problem on campus. You have three minutes to pitch a solution.' }
    ]
  },
  'hitband': {
    purpose: 'Bring student musicians together to play, write and perform live, regardless of how much formal training they have had.',
    activities: ['Band practice sessions', 'Songwriting sessions', 'Live gigs and jam nights', 'Cover arrangement workshops'],
    learn: ['Playing in a band', 'Arrangement and harmony', 'Live performance technique', 'Recording basics'],
    meeting: { day: 'Every Thursday', time: '5:00 PM - 7:30 PM', location: 'Music Room 1' },
    events: [
      { name: 'Open Jam Night', dayOffset: 6, time: '6:00 PM - 9:00 PM', location: 'Student Center Lounge', description: 'Plug in, join a song or start one. Backline equipment provided.' },
      { name: 'Songwriting Circle', dayOffset: 20, time: '5:00 PM - 7:00 PM', location: 'Music Room 1', description: 'Finish the track you have been stuck on. Feedback, not judgement.' },
      { name: 'Battle of the Bands Qualifiers', dayOffset: 37, time: '4:00 PM - 8:00 PM', location: 'Auditorium A', description: 'Set-list performance qualifiers. Selected bands headline the main show.' }
    ]
  },
  'youth-for-seva': {
    purpose: 'Organise student volunteers around causes that need steady, dependable help rather than one-off attention.',
    activities: ['Volunteer training', 'Community outreach visits', 'Fundraising campaigns', 'Blood donation drives'],
    learn: ['Volunteer coordination', 'Community outreach methods', 'Fundraising basics', 'First aid awareness'],
    meeting: { day: 'Every Saturday', time: '9:00 AM - 11:00 AM', location: 'Student Affairs Office, Room 204' },
    events: [
      { name: 'Blood Donation Camp', dayOffset: 15, time: '9:00 AM - 4:00 PM', location: 'Sports Complex Indoor Hall', description: 'Organised with the college health centre. Registration at the entrance.' },
      { name: 'Community Teaching Drive', dayOffset: 33, time: '10:00 AM - 2:00 PM', location: 'Government School, Sector 4', description: 'Volunteers teach and support students at the partner school.' }
    ]
  },
  'sculpture-club': {
    purpose: 'Give students access to three-dimensional tools and materials so they can work with form, mass and material at full scale.',
    activities: ['Clay modelling sessions', 'Stone carving workshops', 'Moulding and casting', 'Exhibition and critique reviews'],
    learn: ['Working with clay and stone', 'Form and proportion', 'Moulding and casting', 'Safe tool use in a studio'],
    meeting: { day: 'Every Monday', time: '4:00 PM - 6:30 PM', location: 'Sculpture Studio, Arts Block' },
    events: [
      { name: 'Clay Basics Session', dayOffset: 8, time: '4:00 PM - 6:30 PM', location: 'Sculpture Studio', description: 'Wheel and hand-building introduction. Materials provided.' },
      { name: 'Student Sculpture Showcase', dayOffset: 32, time: '4:00 PM - 7:00 PM', location: 'Arts Block Courtyard', description: 'Finished works from the semester are displayed with an informal artist talk.' }
    ]
  },
  'rehash-club': {
    purpose: 'Provide an experimental space where students can test strange ideas, share unfinished work and get useful feedback early.',
    activities: ['Idea pitching sessions', 'Rapid prototyping sprints', 'Collaborative experiments', 'Failure-sharing reviews'],
    learn: ['Rapid prototyping', 'Design thinking', 'Peer critique', 'Iterating on an idea quickly'],
    meeting: { day: 'Every Tuesday', time: '4:30 PM - 6:30 PM', location: 'Innovation Hub, Room 2' },
    events: [
      { name: 'Rapid Idea Sprint', dayOffset: 14, time: '4:30 PM - 8:00 PM', location: 'Innovation Hub', description: 'Twenty-four hours, one idea, one prototype, honest feedback at the end.' },
      { name: 'Unfinished Work Review', dayOffset: 30, time: '5:00 PM - 7:00 PM', location: 'Innovation Hub', description: 'Show something that is not ready yet and ask for help.' }
    ]
  },
  'podcast-club': {
    purpose: 'Teach students the full podcast workflow, from choosing a topic and interviewing guests to editing and publishing an episode.',
    activities: ['Recording workshops', 'Interview technique clinics', 'Editing and mastering sessions', 'Season launch events'],
    learn: ['Audio recording basics', 'Interview technique', 'Audio editing and noise reduction', 'Episode structure and storytelling'],
    meeting: { day: 'Every Wednesday', time: '3:30 PM - 5:30 PM', location: 'Broadcast Studio 1' },
    events: [
      { name: 'Recording Clinic', dayOffset: 5, time: '3:30 PM - 5:30 PM', location: 'Broadcast Studio 1', description: 'Room treatment, microphone placement and fixing common audio problems.' },
      { name: 'Live Recording: Guest Interview', dayOffset: 23, time: '4:00 PM - 6:00 PM', location: 'Broadcast Studio 1', description: 'Watch a full interview being recorded, then edit it together as a group.' }
    ]
  },
  'fashify-club': {
    purpose: 'Encourage students to treat clothing as a creative medium and to think about fashion with a sustainability lens.',
    activities: ['Design and sketching sessions', 'Recycled garment workshops', 'Styling competitions', 'Runway shows'],
    learn: ['Garment design basics', 'Fabric and material choice', 'Styling and colour theory', 'Sustainable fashion practices'],
    meeting: { day: 'Every Friday', time: '3:00 PM - 5:00 PM', location: 'Design Studio B' },
    events: [
      { name: 'Recycled Fabric Workshop', dayOffset: 12, time: '3:00 PM - 6:00 PM', location: 'Design Studio B', description: 'Turn discarded fabric into a new garment piece. Scissors, thread and machines provided.' },
      { name: 'Student Runway Show', dayOffset: 34, time: '6:00 PM - 9:00 PM', location: 'Auditorium A', description: 'Student-designed looks presented on stage with a short designer Q&A.' }
    ]
  },
  'self-defense': {
    purpose: 'Build practical awareness and confidence so students can recognise, avoid and respond to unsafe situations.',
    activities: ['Basic self-defense drills', 'Situational awareness training', 'Kickboxing and fitness sessions', 'Personal safety workshops'],
    learn: ['Basic defensive stances and escapes', 'Situational awareness', 'De-escalation and verbal boundaries', 'Physical conditioning'],
    meeting: { day: 'Monday and Thursday', time: '6:00 PM - 7:30 PM', location: 'Sports Complex, Mat Hall' },
    events: [
      { name: 'Self-Defense Basics Workshop', dayOffset: 6, time: '6:00 PM - 8:00 PM', location: 'Mat Hall', description: 'No prior fitness required. Focus on awareness, stances and simple escapes.' },
      { name: 'Women Safety Awareness Session', dayOffset: 27, time: '4:00 PM - 6:00 PM', location: 'Seminar Hall 1', description: 'A discussion and practice session on awareness, boundaries and reporting.' }
    ]
  },
  'korean-club': {
    purpose: 'Introduce Korean language and culture through study circles, food, film and music events open to complete beginners.',
    activities: ['Language practice circles', 'K-pop and film discussion', 'Hangul and calligraphy sessions', 'Korean food nights'],
    learn: ['Hangul reading and writing', 'Basic Korean grammar', 'Korean pop culture context', 'Everyday conversation'],
    meeting: { day: 'Every Wednesday', time: '5:00 PM - 7:00 PM', location: 'Language Lab 2' },
    events: [
      { name: 'Hangul for Absolute Beginners', dayOffset: 9, time: '5:00 PM - 7:00 PM', location: 'Language Lab 2', description: 'Read and write Korean from the very first session.' },
      { name: 'Korean Food Night', dayOffset: 28, time: '6:00 PM - 8:30 PM', location: 'Cafeteria Annexe', description: 'A relaxed evening of Korean food, music and conversation.' }
    ]
  },
  'lets-nacho': {
    purpose: 'Give dancers a serious rehearsal space to train technique, build choreography together and perform on stage.',
    activities: ['Technique classes', 'Choreography workshops', 'Group dance formations', 'Stage performance practice'],
    learn: ['Dance technique and warm-ups', 'Choreography process', 'Stage presence and formations', 'Conditioning for dancers'],
    meeting: { day: 'Every Tuesday and Friday', time: '5:00 PM - 7:00 PM', location: 'Dance Studio 1' },
    events: [
      { name: 'Choreography Workshop', dayOffset: 10, time: '5:00 PM - 7:30 PM', location: 'Dance Studio 1', description: 'Build a piece from one musical phrase over two sessions.' },
      { name: 'Term-End Stage Showcase', dayOffset: 33, time: '6:00 PM - 9:00 PM', location: 'Auditorium A', description: 'The club presents its full performance set to the college.' }
    ]
  },
  'hackathon-club': {
    purpose: 'Run build-focused weekends where students form teams, build something real and learn to ship under time pressure.',
    activities: ['Hackathon weekends', 'Tech talk sessions', 'Mentor office hours', 'Demo days'],
    learn: ['Working in a team under deadline', 'Rapid prototyping', 'Version control in a team', 'Presenting a working demo'],
    meeting: { day: 'Every Saturday', time: '4:00 PM - 6:00 PM', location: 'Innovation Hub, Room 1' },
    events: [
      { name: '36-Hour Campus Hackathon', dayOffset: 13, time: '8:00 AM - 8:00 PM', location: 'Innovation Hub', description: 'Teams of up to four, mentors on site, demo presentation on the final day.' },
      { name: 'Tech Talk: Building Your First API', dayOffset: 27, time: '4:00 PM - 6:00 PM', location: 'Computer Lab A', description: 'A practical walkthrough of designing and shipping a small backend.' }
    ]
  },
  'nss-club': {
    purpose: 'Run long-term volunteer programmes in the surrounding area through the National Service Scheme framework.',
    activities: ['Village and school outreach', 'Health awareness camps', 'Environmental action days', 'Volunteer training camps'],
    learn: ['Community project planning', 'Social survey methods', 'Volunteer leadership', 'Public health awareness'],
    meeting: { day: 'Every Saturday', time: '8:30 AM - 10:30 AM', location: 'NSS Cell, Administrative Block' },
    events: [
      { name: 'Seven-Day NSS Camp', dayOffset: 18, time: 'All day', location: 'Village Anandpur, District Road', description: 'A residential camp on community health, education and cleanliness.' },
      { name: 'Health Awareness Camp', dayOffset: 31, time: '9:00 AM - 2:00 PM', location: 'College Ground', description: 'Free basic health screening and awareness sessions with visiting medical staff.' }
    ]
  },
  'ncc-club': {
    purpose: 'Build leadership, physical fitness and a sense of responsible citizenship through structured training and service.',
    activities: ['Drill and physical training', 'Leadership workshops', 'Cadet camps', 'Community service duties'],
    learn: ['Physical fitness and drill', 'Leadership and discipline', 'First aid and emergency response', 'Citizenship and community service'],
    meeting: { day: 'Monday, Wednesday, Friday', time: '6:00 AM - 8:00 AM', location: 'Training Ground, North Block' },
    events: [
      { name: 'Annual Cadet Camp', dayOffset: 20, time: 'All day', location: 'NCC Training Camp Site', description: 'A multi-day camp covering drill, map work, first aid and adventure activities.' },
      { name: 'Independence Day Flag Ceremony', dayOffset: 16, time: '7:30 AM - 9:00 AM', location: 'Main Ground', description: 'Cadets lead the ceremony. Volunteers for guard duty and flag handling welcome.' }
    ]
  },
  'minds-club': {
    purpose: 'Create room for students to think out loud, read widely and argue ideas without either side feeling attacked.',
    activities: ['Weekly reading discussions', 'Open debate sessions', 'Idea exchange forums', 'Essay and writing circles'],
    learn: ['Critical reading', 'Structured argument', 'Public discussion', 'Clear academic writing'],
    meeting: { day: 'Every Friday', time: '4:00 PM - 6:00 PM', location: 'Library Reading Room 2' },
    events: [
      { name: 'Monthly Debate: Open Floor', dayOffset: 12, time: '4:00 PM - 6:00 PM', location: 'Seminar Hall 3', description: 'Motion is decided by the audience on the night. Novice speakers encouraged.' },
      { name: 'Reading Circle: Short Story Night', dayOffset: 29, time: '4:00 PM - 5:30 PM', location: 'Library Reading Room 2', description: 'Discuss one short story in detail. Copies available at the counter.' }
    ]
  }
};

function getClubData() {
  return CLUB_DATA;
}

function getClubDetails(id) {
  return CLUB_DETAILS[id] || null;
}

function hasJoinedClub(clubId) {
  return readJoinedClubs().indexOf(clubId) !== -1;
}

function joinClub(clubId) {
  const joined = readJoinedClubs();
  if (joined.indexOf(clubId) === -1) {
    joined.push(clubId);
    writeJoinedClubs(joined);
  }
  return joined;
}

function leaveClub(clubId) {
  const joined = readJoinedClubs();
  const idx = joined.indexOf(clubId);
  if (idx !== -1) {
    joined.splice(idx, 1);
    writeJoinedClubs(joined);
  }
  return joined;
}

const JOINED_STORAGE_KEY = 'scms_joined_clubs';

function readJoinedClubs() {
  try {
    const raw = window.localStorage.getItem(JOINED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeJoinedClubs(list) {
  try {
    window.localStorage.setItem(JOINED_STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    /* storage unavailable (private mode) — joined state stays session-only */
  }
}

/** Joined club ids for the current student, in join order. */
function getJoinedClubIds() {
  return readJoinedClubs();
}

/**
 * Canonical category slug for a category label.
 *   "Sports & Fitness" -> "sports-fitness"
 *   "Technical"        -> "technical"
 *
 * This is the one place the label -> slug rule exists. Club filters, event
 * filters, footer deep links and the club cards all resolve through it, so
 * a category can never mean two different things on two pages.
 */
function toCategorySlug(category) {
  return String(category || '')
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Human label for a category slug (falls back to the input when unknown). */
function getCategoryLabel(categoryOrSlug) {
  const raw = String(categoryOrSlug || '');
  const match = CATEGORIES.find(cat => cat.id === toCategorySlug(raw));
  return match ? match.label : raw;
}

function getCategories() {
  return CATEGORIES;
}

function getCategoryBadgeStyle(category) {
  return CATEGORY_BADGE_STYLES[category] || CATEGORY_BADGE_STYLES['Other'];
}

function filterClubs(searchTerm, categoryId) {
  const term = (searchTerm || '').toLowerCase().trim();
  const cat = toCategorySlug(categoryId || 'all') || 'all';

  return CLUB_DATA.filter(club => {
    const matchesSearch = term === '' ||
      club.name.toLowerCase().includes(term) ||
      club.category.toLowerCase().includes(term) ||
      club.description.toLowerCase().includes(term);

    const matchesCategory = cat === 'all' || toCategorySlug(club.category) === cat;

    return matchesSearch && matchesCategory;
  });
}

function getClubById(id) {
  return CLUB_DATA.find(club => club.id === id);
}

export {
  getClubData,
  getCategories,
  getCategoryBadgeStyle,
  getCategoryLabel,
  toCategorySlug,
  filterClubs,
  getClubById,
  getClubDetails,
  hasJoinedClub,
  joinClub,
  leaveClub,
  getJoinedClubIds
};