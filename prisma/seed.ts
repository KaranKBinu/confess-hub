import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";
import { recomputeTrending } from "../lib/recomputeTrending";

const prisma = new PrismaClient();

const SERIES_GOSSIP = "confess-hub-series-gossip";
const SERIES_CLOSET = "confess-hub-series-closet";

type SeedStory = {
  id: string;
  content: string;
  language: "en" | "ml" | "hi";
  authorUserId?: string;
  showAuthor?: boolean;
  seriesId?: string;
  partIndex?: number;
  partTotal?: number;
};

const demoUsers = [
  {
    id: "confess-hub-demo-user-1",
    email: "demo.reader@confess-hub.local",
    username: "sunny_otter_318",
    displayName: "Sunny Otter",
  },
  {
    id: "confess-hub-demo-user-2",
    email: "demo.witty@confess-hub.local",
    username: "witty_sparrow_77",
    displayName: "Witty Sparrow",
  },
  {
    id: "confess-hub-demo-user-3",
    email: "demo.kind@confess-hub.local",
    username: "kind_mango_204",
    displayName: "Kind Mango",
  },
] as const;

const demoStories: SeedStory[] = [
  { id: "confess-hub-demo-en", language: "en", content: "I waved back at someone who was waving to the person behind me. We both committed to the bit for an entire elevator ride." },
  { id: "confess-hub-demo-en-2", language: "en", content: "Replied-all to the entire company with 'sounds good!' about a dentist appointment I was not invited to discuss." },
  { id: "confess-hub-demo-en-3", language: "en", content: "Practiced accepting an award in the shower. Slipped, grabbed the curtain, and bowed to an empty bathroom anyway." },
  { id: "confess-hub-en-gossip-1", language: "en", seriesId: SERIES_GOSSIP, partIndex: 1, partTotal: 3, authorUserId: "confess-hub-demo-user-2", showAuthor: true, content: "Office gossip says the CEO is dating someone from accounting. Plot twist: it's the office plant guy—he just waters plants near her desk a lot." },
  { id: "confess-hub-en-gossip-2", language: "en", seriesId: SERIES_GOSSIP, partIndex: 2, partTotal: 3, authorUserId: "confess-hub-demo-user-2", showAuthor: true, content: "Part two of the gossip spiral: someone started a secret Slack channel called #totally-not-gossip. The only rule is you must type 'this stays between us' before every message." },
  { id: "confess-hub-en-gossip-3", language: "en", seriesId: SERIES_GOSSIP, partIndex: 3, partTotal: 3, authorUserId: "confess-hub-demo-user-2", showAuthor: true, content: "Final gossip chapter: HR sent a kind email about professionalism. We all said 'understood' and immediately opened the channel again. The drama continues." },
  { id: "confess-hub-en-crush-1", language: "en", content: "Had a secret crush on my gym buddy for months. Finally said hi—turns out she thought my headphones were a bold fashion choice, not AirPods." },
  { id: "confess-hub-en-crush-2", language: "en", content: "My crush at the coffee shop wrote my name as 'Karen' for three weeks. I'm not Karen. I'm still going back because the crush is stubborn and the latte is good." },
  { id: "confess-hub-en-gay-1", language: "en", authorUserId: "confess-hub-demo-user-1", showAuthor: true, content: "Came out to my friends at brunch. They cheered, then spent twenty minutes arguing whether my 'big news' counted as the main character moment of the table." },
  { id: "confess-hub-en-gay-2", language: "en", content: "First Pride parade: wore rainbow socks hidden under jeans because I wasn't ready. A stranger still said 'happy Pride' and I cried in the best way." },
  { id: "confess-hub-en-gay-3", language: "en", authorUserId: "confess-hub-demo-user-3", showAuthor: true, content: "Matched with someone on a dating app who listed 'slow burns and good memes.' We're together now. The gossip at work was louder than our first kiss story." },
  { id: "confess-hub-en-closet-1", language: "en", seriesId: SERIES_CLOSET, partIndex: 1, partTotal: 2, authorUserId: "confess-hub-demo-user-1", showAuthor: true, content: "Still in the closet at family dinners. My aunt asked if I have a 'nice friend.' I said yes and described my roommate who is literally just my roommate. Awkward crush on a cousin's friend made the gossip worse." },
  { id: "confess-hub-en-closet-2", language: "en", seriesId: SERIES_CLOSET, partIndex: 2, partTotal: 2, authorUserId: "confess-hub-demo-user-1", showAuthor: true, content: "Part two: told one cousin in the parking lot. She said she already knew because I once called a rom-com 'relatable.' Planning to come out fully at the next wedding. Secret's almost out." },
  { id: "confess-hub-en-office-1", language: "en", content: "Office romance rumor about me and IT support because we fix each other's laptops. The truth is we only talk about printers and shared trauma from email threads." },
  { id: "confess-hub-en-office-2", language: "en", content: "Used 'per my last email' in a fight with a coworker. Won the argument, lost the team lunch invite. Worth it for the gossip summary in the break room." },
  { id: "confess-hub-en-dating-1", language: "en", content: "Went on a dating disaster where they talked about their ex for forty minutes. I nodded like a therapist and secretly ordered dessert to-go for moral support." },
  { id: "confess-hub-en-dating-2", language: "en", content: "Second date went well until I said 'I love drama' as a joke. They thought I meant relationship drama. We're not dating, but the group chat gossip is thriving." },
  { id: "confess-hub-en-friends-1", language: "en", content: "My friends know every crush I've had since 2016 and still introduce me as 'emotionally available but chaotic.'" },
  { id: "confess-hub-en-secret-1", language: "en", content: "Kept a secret friendship with my ex's roommate. The gossip triangle could power a small town. We're just study buddies—I swear." },
  { id: "confess-hub-en-wedding-1", language: "en", content: "At a wedding I caught the bouquet by accident, tripped, and handed it to a kid. Family gossip now says I'm 'next' anyway." },
  { id: "confess-hub-en-pride-1", language: "en", content: "Chaperoned a school friend's first queer date by sitting three tables away with sunglasses indoors. Proud wingman energy, zero subtlety." },
  { id: "confess-hub-en-drama-1", language: "en", content: "Started a group chat drama by sending a meme to the wrong thread. Apologized with pizza. Peace treaty signed with extra gossip receipts." },
  { id: "confess-hub-en-neighbor-1", language: "en", content: "Neighbors gossip that I blast sad songs at night. It's true. It's called processing and also Taylor Swift." },
  { id: "confess-hub-en-roommate-1", language: "en", content: "Roommate thinks my dating life is a sitcom. I brought home flowers for myself and they still asked who the secret admirer is." },

  { id: "confess-hub-demo-ml", language: "ml", content: "കടയിൽ പോയി കുട വാങ്ങി. വീട്ടിലെത്തിയപ്പോൾ മനസ്സിലായി—മഴ പെയ്യാതിരിക്കാൻ വീട്ടിൽ നിന്നിറങ്ങുമ്പോൾ എടുത്ത കുട അതുതന്നെയായിരുന്നു!" },
  { id: "confess-hub-demo-ml-2", language: "ml", content: "റെസ്റ്റോറന്റിൽ സ്പൂന്നിൽ സൂപ്പ് കുടിച്ചു. കൂടെയുള്ളവർ എല്ലാം ഫോർക്ക് ഉപയോഗിക്കുന്നു എന്ന് അപ്പോഴാണ് ഓർത്തത്." },
  { id: "confess-hub-ml-gossip-1", language: "ml", content: "ഓഫീസിലെ gossip പ്രകാരം രണ്ട് കൂട്ടുകാർ dating ആണ്—ആശ്ചര്യം, അവർ കേവലം liftൽ ഒരുമിച്ച് coffee കുടിക്കുന്നവർ മാത്രം." },
  { id: "confess-hub-ml-crush-1", language: "ml", content: "കോളേജിലെ secret crush-ിനോട് Malayalam movie dialogue പറഞ്ഞു. അവർ Hindi സിനിമയാണെന്ന് വിശ্বസിച്ചു. Crush ഇപ്പോഴും ഉണ്ട്." },
  { id: "confess-hub-ml-friends-1", language: "ml", content: "സുഹൃത്തുക്കൾ എന്റെ dating ചരിത്രം ഒരു podcast പോലെ വാട്സാപ്പിൽ പങ്കിടുന്നു." },

  { id: "confess-hub-demo-hi", language: "hi", content: "ऑनलाइन मीटिंग में पाँच मिनट तक बोलता रहा। फिर पता चला कि माइक बंद था—और कैमरा भी।" },
  { id: "confess-hub-demo-hi-2", language: "hi", content: "जिम में गलत दर्शक को 'बहुत बढ़िया!' बोल दिया। वो मेरा ट्रेनर नहीं था—बस पास में खड़ा कोई अजनबी था." },
  { id: "confess-hub-hi-gossip-1", language: "hi", content: "ऑफिस gossip कहती है मैं manager के साथ lunch करता हूँ—सच यह है कि हम सिर्फ़ payroll की शिकायत साझा करते हैं." },
  { id: "confess-hub-hi-crush-1", language: "hi", content: "Metro में crush को note दिया, वो auto driver को दे बैठा। Secret crush अब city-wide gossip बन गई." },
  { id: "confess-hub-hi-gay-1", language: "hi", content: "दोस्तों को coming out की प्लानिंग थी, पर उन्हें पहले से पता था क्योंकि मैं rainbow cake बहाना बना लिया." },
  { id: "confess-hub-hi-dating-1", language: "hi", content: "Dating app पर match हुआ—पहली date पर हमने तीन घंटे office gossip की। शायद यही love language है." },
];

const demoComments: Array<{ id: string; postId: string; userId: string; content: string }> = [
  { id: "confess-hub-comment-1", postId: "confess-hub-demo-en", userId: "confess-hub-demo-user-1", content: "The solidarity in that elevator is beautiful. Nobody broke character." },
  { id: "confess-hub-comment-2", postId: "confess-hub-demo-en", userId: "confess-hub-demo-user-2", content: "This is why I pretend to read my phone in lobbies now." },
  { id: "confess-hub-comment-3", postId: "confess-hub-demo-en-2", userId: "confess-hub-demo-user-3", content: "Reply-all courage is a whole personality type." },
  { id: "confess-hub-comment-4", postId: "confess-hub-demo-ml", userId: "confess-hub-demo-user-1", content: "കുട വാങ്ങിയതും ഉപയോഗിച്ചതും ഒരേ ദിവസം — classic." },
  { id: "confess-hub-comment-5", postId: "confess-hub-demo-hi", userId: "confess-hub-demo-user-2", content: "पाँच मिनट की स्पीच का आत्मविश्वास समझ सकता हूँ 😄" },
  { id: "confess-hub-comment-6", postId: "confess-hub-en-gossip-1", userId: "confess-hub-demo-user-3", content: "The #totally-not-gossip channel is painfully real." },
  { id: "confess-hub-comment-7", postId: "confess-hub-en-gay-1", userId: "confess-hub-demo-user-2", content: "Main character brunch energy. Proud of you." },
];

const BULK_USER_COUNT = 100;
const BULK_POST_COUNT = 200;
const BULK_COMMENT_COUNT = 300;
const BULK_APPROVED_RATIO = 0.9;

type BulkLanguage = "en" | "ml" | "hi";

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

const bulkAdjectives = [
  "Brave", "Sleepy", "Chaotic", "Gentle", "Curious", "Sunny", "Nervous",
  "Dramatic", "Quiet", "Witty", "Kind", "Restless", "Cheerful", "Moody",
  "Clumsy", "Bold", "Thoughtful", "Goofy", "Calm", "Sparkly",
] as const;

const bulkNouns = [
  "Otter", "Sparrow", "Mango", "Penguin", "Comet", "Willow", "Panda", "Fox",
  "Cloud", "Maple", "Raven", "Lemon", "Tiger", "Pebble", "Sparrow", "Moon",
  "Cactus", "Dolphin", "Hazel", "Sprout",
] as const;

const bulkContentTemplates: Record<BulkLanguage, readonly string[]> = {
  en: [
    "I told my boss I was working from home and spent the whole day reorganizing my bookshelf by color. It looked great on the video call background.",
    "Replied to a very serious email with 'lol same' and then stared at the ceiling for ten minutes waiting for my life to flash before my eyes.",
    "My neighbor waved at me, I waved back, and then we both realized she was waving at the dog behind me. The cringe is still living rent free in my head.",
    "I practiced a confident presentation in the mirror, tripped over the rug, and apologized to the furniture out loud.",
    "Went to the gym for the first time in months and spent twenty minutes figuring out how the treadmill worked while pretending to stretch.",
    "I have been telling everyone I am 'so busy' lately. Truth is I am just avoiding the group chat and its endless drama.",
    "Ordered a salad to feel healthy, then ate half my friend's fries and called it balance.",
    "My roommate asked who sent me flowers. I bought them for myself and said nothing because the mystery is more fun.",
    "I accidentally liked an old photo while deep in someone's profile. The plot twist is that they liked three of mine back.",
    "Sang loudly in the car at a red light and then noticed the person in the next car was filming me like a music video.",
    "Told a coworker I loved their idea, then spent the meeting trying to remember what the idea actually was.",
    "I keep a secret snack drawer at work. The main character energy of that drawer is stronger than my career plan.",
    "Went on a date and spent the whole time talking about my cat. We are getting married in my imagination, not in reality.",
    "I promised myself I would sleep early and then watched one more episode for four hours straight. Classic.",
    "My friends think I am mysterious because I leave parties early. I am actually just socially exhausted and thinking about pajamas.",
    "I sent a voice note to the wrong group chat and spent the rest of the day performing damage control with memes.",
    "The office gossip says I am dating someone in accounting. We only share a coffee machine and mutual fear of spreadsheets.",
    "I clapped at the end of a movie in a theater where nobody else clapped. Awkward silence is my love language now.",
    "Tried to be mysterious and say 'it's complicated' about my weekend. I was literally just doing laundry.",
    "I keep buying plants and naming them after people I have crushes on. The leafy gossip is getting out of hand.",
  ],
  ml: [
    "ഓൺലൈൻ ക്ലാസിൽ പത്ത് മിനിറ്റ് സംസാരിച്ചു, പിന്നെ മനസ്സിലായി മൈക്ക് ഓഫ് ആയിരുന്നു. ചാറ്റിൽ എല്ലാവരും ചിരിക്കുന്നു.",
    "അമ്മയോട് കള്ളം പറഞ്ഞു—ഞാൻ നേരത്തെ ഉറങ്ങി. യാഥാർത്ഥ്യത്തിൽ രാത്രി മുഴുവൻ സീരീസ് കണ്ടിരുന്നു.",
    "ഓഫീസിൽ എല്ലാവരും എന്നെ അച്ചടക്കമുള്ളവനെന്ന് വിളിക്കുന്നു. ഞാൻ വെറുതെ യോഗത്തിൽ എപ്പോഴും മിണ്ടാതിരിക്കുന്നു.",
    "ഒരു കോളേജ് crush-നോട് ഹായ് പറയാൻ ധൈര്യപ്പെട്ടു. അവൾ എന്റെ ഷൂസിനെക്കുറിച്ചാണ് സംസാരിച്ചത്.",
    "കൂട്ടുകാരുടെ group chat-ൽ ഞാൻ ഇല്ലാത്തപ്പോൾ എന്റെ പേര് പറയുന്നത് കേട്ടു. അബ്സർഡ് ആയിരുന്നു, പക്ഷേ ചിരി വന്നു.",
    "ബസിൽ ഉറങ്ങി, സ്റ്റോപ്പ് കഴിഞ്ഞു പോയി. ഞാൻ ഇറങ്ങിയത് ഒരു മണിക്കൂർ കഴിഞ്ഞ്, അതും തെറ്റായ സ്ഥലത്ത്.",
    "ഡേറ്റിംഗ് ആപ്പിൽ match ആയി. ആദ്യ സന്ദർശനത്തിൽ അവർ എന്റെ മുൻകാല പ്രണയത്തെക്കുറിച്ച് മാത്രം സംസാരിച്ചു.",
    "ഓഫീസിലെ gossip പ്രകാരം ഞാൻ manager-ന്റെ പ്രിയപ്പെട്ടവനാണ്. സത്യം—ഞാൻ അവരുടെ കോഫി മാത്രം എടുത്തുകൊടുക്കുന്നു.",
    "വീട്ടിൽ ഒരു secret crush ഉണ്ടെന്ന് എല്ലാവരും സംശയിക്കുന്നു. ഞാൻ ഓരോ ദിവസവും അതെ പ്ലാന്റിനെ നോക്കി ചിരിക്കുന്നു.",
    "ഒരു നോട്ട് എഴുതി മറ്റൊരാൾക്ക് കൊടുത്തു. ഇപ്പോൾ അത് സ്കൂളിലെ മുഴുവൻ gossip ആണ്.",
  ],
  hi: [
    "ऑनलाइन मीटिंग में पाँच मिनट बोलता रहा, फिर पता चला माइक और कैमरा दोनों बंद थे। चैट में सब हँस रहे थे।",
    "मम्मी से कहा कि मैं जल्दी सो गया, जबकि सच में पूरी रात सीरीज़ देख रहा था। सुबह चेहरा ही गवाही दे रहा था।",
    "ऑफिस में सब मुझे शांत और गंभीर समझते हैं। असल में मैं मीटिंग में सिर्फ़ खुद को जगाए रखने की कोशिश करता हूँ।",
    "क्रश को हाय कहने की हिम्मत की। उसने मेरे जूतों की तारीफ़ की। मैंने इसे proposal समझ लिया, अजीब बात है।",
    "दोस्तों के ग्रुप चैट में मेरी कमी सिर्फ़ तब महसूस होती है जब बिल बाँटने की बात आती है।",
    "जिम में ट्रेडमिल चालू करने में बीस मिनट लगाए और फिर दिखावा किया कि मैं स्ट्रेचिंग कर रहा हूँ।",
    "मैंने खुद को सीरियस दिखाने के लिए चश्मा पहना। लोगों ने पूछा कि क्या मैं फ़िल्म का नया विलेन हूँ।",
    "डेटिंग ऐप पर मैच हुआ, पहली डेट पर तीन घंटे ऑफिस की gossip की। शायद यही मेरी love language है।",
    "मैंने कहा कि मैं बहुत व्यस्त हूँ, असल में मैं घर पर आलस कर रहा था और पिज़्ज़ा ऑर्डर करने की सोच रहा था।",
    "पड़ोसी समझते हैं कि मैं रात भर दुख भरे गाने सुनता हूँ। सच यह है कि मैं बस बहाना बनाकर नाच रहा था।",
  ],
};

const bulkTwists: Record<BulkLanguage, readonly string[]> = {
  en: [
    "The group chat has receipts.",
    "Plot twist: nobody noticed, and that is somehow worse.",
    "I have been thinking about this for a week. Cringe, honestly.",
    "My main character moment was witnessed by exactly one person, and they were on a call.",
    "I told this story at dinner and everyone said it was very on brand for me.",
    "Anyway, I am never going back to that coffee shop.",
  ],
  ml: [
    "ഇത് ഇപ്പോൾ നാട്ടിലെ മുഴുവൻ gossip ആണ്.",
    "ചിരി അടക്കാൻ പറ്റിയില്ല, എന്റെ കൂടെയുള്ളവരും ചിരിച്ചു.",
    "ഇത് ഞാൻ ഇപ്പോഴും ഓർക്കുമ്പോൾ അബ്സർഡ് ആയി തോന്നുന്നു.",
    "ഗ്രൂപ്പ് ചാറ്റിൽ ഇതിന്റെ സ്ക്രീൻഷോട്ട് ഇപ്പോഴും ഉണ്ട്.",
    "അന്ന് മുതൽ എന്റെ പേര് ഒരു കഥയായി മാറി.",
    "ഞാൻ ഇത് ആരോടും പറയേണ്ടിയിരുന്നില്ല, പക്ഷേ പറഞ്ഞു.",
  ],
  hi: [
    "अब यह पूरे ऑफिस की gossip है।",
    "प्लॉट ट्विस्ट: किसी ने ध्यान नहीं दिया, और यही सबसे अजीब बात है।",
    "आज भी याद करके हँसी आ जाती है।",
    "ग्रुप चैट में इसका स्क्रीनशॉट आज भी मौजूद है।",
    "उस दिन के बाद मेरा नाम एक किस्सा बन गया।",
    "मुझे यह किसी को नहीं बताना चाहिए था, पर मज़ेदार था।",
  ],
};

const bulkCommentsByLanguage: Record<BulkLanguage, readonly string[]> = {
  en: [
    "This is so relatable it hurts.",
    "The group chat would have a field day with this.",
    "Honestly, iconic behavior.",
    "I felt the cringe through the screen.",
    "Plot twist was worth the read.",
    "Please tell me there is a part two.",
  ],
  ml: [
    "ഇത് വളരെ relatable ആണ്.",
    "ചിരി അടക്കാൻ പറ്റിയില്ല.",
    "ഇതിന്റെ part two വേണം.",
    "ഗ്രൂപ്പ് ചാറ്റിൽ ഇത് പറയണം.",
    "അബ്സർഡ് ആയിട്ടുണ്ട്, പക്ഷേ ഇഷ്ടപ്പെട്ടു.",
    "ഇത് എന്റെ കഥയാണെന്ന് തോന്നുന്നു.",
  ],
  hi: [
    "यह इतना relatable है कि दर्द हो रहा है।",
    "मज़ेदार कहानी है, part two चाहिए।",
    "ग्रुप चैट में यही चर्चा होगी।",
    "अजीब है, पर बहुत पसंद आया।",
    "हँसते-हँसते पेट दुख गया।",
    "लगता है यह मेरी ही कहानी है।",
  ],
};

async function seedBulkData(passwordHash: string): Promise<{
  users: number;
  posts: number;
  approved: number;
  comments: number;
  votes: number;
}> {
  const random = createRandom(20261118);
  const now = Date.now();

  const bulkUsers = Array.from({ length: BULK_USER_COUNT }, (_, index) => {
    const n = String(index + 1).padStart(3, "0");
    return {
      id: `seed-user-${n}`,
      email: `seed.user.${n}@confess-hub.local`,
      username: `seed_user_${n}`,
      displayName: `${pick(random, bulkAdjectives)} ${pick(random, bulkNouns)}`.slice(0, 40),
    };
  });

  const bulkPosts = Array.from({ length: BULK_POST_COUNT }, (_, index) => {
    const n = String(index + 1).padStart(3, "0");
    const language = pick(random, ["en", "ml", "hi"] as const);
    const template = pick(random, bulkContentTemplates[language]);
    const twist = pick(random, bulkTwists[language]);
    const author = random() < 0.35 ? pick(random, bulkUsers) : null;
    const statusRoll = random();
    const status: "APPROVED" | "PENDING" | "REJECTED" = statusRoll < BULK_APPROVED_RATIO
      ? "APPROVED"
      : statusRoll < BULK_APPROVED_RATIO + 0.06
        ? "PENDING"
        : "REJECTED";
    const createdAt = new Date(
      now - Math.floor(random() * 45) * 86_400_000 - Math.floor(random() * 86_400_000),
    );

    return {
      id: `seed-post-${n}`,
      content: `${template} ${twist}`.slice(0, 2000),
      language,
      anonymousId: `seed-anon-${n}`,
      status,
      authorUserId: author?.id ?? null,
      showAuthor: Boolean(author) && random() < 0.5,
      createdAt,
      updatedAt: createdAt,
    };
  });

  const commentablePosts = bulkPosts.filter((post) => post.status !== "REJECTED");
  const bulkComments = Array.from({ length: BULK_COMMENT_COUNT }, (_, index) => {
    const post = pick(random, commentablePosts);
    const user = pick(random, bulkUsers);
    const createdAt = new Date(
      Math.min(now, post.createdAt.getTime() + Math.floor(random() * 7 * 86_400_000)),
    );
    return {
      id: `seed-comment-${String(index + 1).padStart(3, "0")}`,
      postId: post.id,
      userId: user.id,
      content: pick(random, bulkCommentsByLanguage[post.language]),
      createdAt,
    };
  });

  const bulkVotes: Array<{
    postId: string;
    userId: string;
    value: "LIKE" | "DISLIKE";
    createdAt: Date;
  }> = [];
  for (const post of bulkPosts) {
    if (post.status !== "APPROVED") continue;
    const voters = new Set<string>();
    const voterCount = Math.floor(random() * 28);
    while (voters.size < voterCount) voters.add(pick(random, bulkUsers).id);
    for (const userId of voters) {
      bulkVotes.push({
        postId: post.id,
        userId,
        value: random() < 0.82 ? "LIKE" : "DISLIKE",
        createdAt: post.createdAt,
      });
    }
  }

  await prisma.post.deleteMany({ where: { id: { startsWith: "seed-post-" } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: "seed-user-" } } });

  await prisma.user.createMany({
    data: bulkUsers.map((user) => ({ ...user, passwordHash, role: "USER" as const })),
  });
  await prisma.post.createMany({ data: bulkPosts });
  await prisma.comment.createMany({ data: bulkComments });
  for (let index = 0; index < bulkVotes.length; index += 2000) {
    await prisma.vote.createMany({ data: bulkVotes.slice(index, index + 2000) });
  }

  return {
    users: bulkUsers.length,
    posts: bulkPosts.length,
    approved: bulkPosts.filter((post) => post.status === "APPROVED").length,
    comments: bulkComments.length,
    votes: bulkVotes.length,
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seed data must not be added to production.");
  }

  const passwordHash = await hashPassword("demo-password-12");

  for (const account of demoUsers) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: { username: account.username, displayName: account.displayName },
      create: {
        ...account,
        passwordHash,
        role: "USER",
      },
    });
  }

  for (const story of demoStories) {
    await prisma.post.upsert({
      where: { id: story.id },
      update: {
        content: story.content,
        status: "APPROVED",
        authorUserId: story.authorUserId ?? null,
        showAuthor: Boolean(story.showAuthor),
        seriesId: story.seriesId ?? null,
        partIndex: story.partIndex ?? 1,
        partTotal: story.partTotal ?? null,
      },
      create: {
        id: story.id,
        content: story.content,
        language: story.language,
        anonymousId: "confess-hub-demo-seed",
        status: "APPROVED",
        authorUserId: story.authorUserId ?? null,
        showAuthor: Boolean(story.showAuthor),
        seriesId: story.seriesId ?? null,
        partIndex: story.partIndex ?? 1,
        partTotal: story.partTotal ?? null,
      },
    });
  }

  for (const comment of demoComments) {
    await prisma.comment.upsert({
      where: { id: comment.id },
      update: { content: comment.content },
      create: comment,
    });
  }

  const votePairs: Array<[string, string]> = [
    ["confess-hub-demo-en", "confess-hub-demo-user-1"],
    ["confess-hub-demo-en", "confess-hub-demo-user-2"],
    ["confess-hub-demo-en-3", "confess-hub-demo-user-3"],
    ["confess-hub-en-gossip-1", "confess-hub-demo-user-1"],
    ["confess-hub-en-gay-1", "confess-hub-demo-user-2"],
    ["confess-hub-en-crush-1", "confess-hub-demo-user-3"],
    ["confess-hub-hi-gossip-1", "confess-hub-demo-user-1"],
  ];

  for (const [postId, userId] of votePairs) {
    await prisma.vote.upsert({
      where: { postId_userId: { postId, userId } },
      update: { value: "LIKE" },
      create: { postId, userId, value: "LIKE" },
    });
  }

  const bulk = await seedBulkData(passwordHash);
  const trending = await recomputeTrending();

  console.info(`Seeded ${demoStories.length} stories, ${demoUsers.length} demo users, and ${demoComments.length} comments.`);
  console.info(`Seeded ${bulk.users} bulk users, ${bulk.posts} confessions (${bulk.approved} approved), ${bulk.comments} comments, and ${bulk.votes} votes.`);
  console.info(`Rebuilt ${trending.filterTokens} filter tokens and ${trending.updated} trending entries.`);
  console.info("Demo login: demo.reader@confess-hub.local / demo-password-12");
  console.info("Bulk login: seed.user.001@confess-hub.local / demo-password-12");
}

main()
  .catch((error: unknown) => {
    console.error("Unable to seed the development database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });