"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { LanguageCode } from "@/components/LanguageSelector";
import TrendingCarousel from "@/components/TrendingCarousel";
import MobileSnapFeed from "@/components/MobileSnapFeed";
import FeedOnboarding from "@/components/FeedOnboarding";
import Tooltip from "@/components/Tooltip";
import { IconFlag } from "@/components/NavIcons";
import { IconComment, IconEdit, IconSend, IconShare, IconThumbDown, IconThumbUp, IconTrash } from "@/components/ReactionIcons";
import { extractContentTokens } from "@/lib/contentTokens";
import RichTextContent from "@/components/RichTextContent";
import RichTextEditor from "@/components/RichTextEditor";
import ShareSheet from "@/components/ShareSheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type Post = {
  id: string;
  content: string;
  language: LanguageCode;
  createdAt: string;
  likes: number;
  dislikes: number;
  commentCount: number;
  viewerVote: "LIKE" | "DISLIKE" | null;
  seriesId: string | null;
  partIndex: number;
  partTotal: number | null;
  author: { username: string; displayName: string } | null;
  canEdit: boolean;
  canDelete: boolean;
  canAppendPart: boolean;
};
type Facet = { token: string; frequency: number };
type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  role: "USER" | "ADMIN";
  showUsernameOnPosts: boolean;
};
type Comment = { id: string; content: string; createdAt: string; user: { username: string; displayName: string } };

function avatarInitial(user: { username: string; displayName: string }): string {
  return (user.displayName || user.username).charAt(0).toUpperCase();
}

function formatTimeAgo(iso: string, locale: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d`;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}
type SortMode = "latest" | "top" | "random";

const languageNames: Record<LanguageCode, string> = {
  en: "English",
  ml: "മലയാളം",
  hi: "हिन्दी",
};

const copy: Record<LanguageCode, {
  placeholder: string;
  submit: string;
  headline: string;
  eyebrow: string;
  heroCopy: string;
  feedTitle: string;
  composeTitle: string;
  composeHint: string;
  loading: string;
  emptyTitle: string;
  emptyPrompt: string;
  report: string;
  reported: string;
  reportAria: string;
  storyAria: string;
  shareAria: string;
  privacyTitle: string;
  privacyCopy: string;
  latest: string;
  top: string;
  random: string;
  shareCopyLink: string;
  shareNative: string;
  shareClose: string;
  shareSheetTitle: string;
  formatToolbar: string;
  like: string;
  dislike: string;
  comments: string;
  commentPlaceholder: string;
  postComment: string;
  loginToComment: string;
  loginToReact: string;
  reportError: string;
  commentsLoading: string;
  noComments: string;
  viewAllComments: string;
  trendingTitle: string;
  trendingLoading: string;
  trendingEmpty: string;
  trendingByline: string;
  partLabel: string;
  showUsername: string;
  showUsernameHint: string;
  multiPartTitle: string;
  multiPartHint: string;
  addPart: string;
  partField: string;
  swipeVertical: string;
  swipeHorizontal: string;
  searchPlaceholder: string;
  searchLabel: string;
  filterTitle: string;
  clearFilters: string;
  editStory: string;
  deleteStory: string;
  saveEdit: string;
  cancelEdit: string;
  editWindowHint: string;
  deleteConfirm: string;
  shareStory: string;
  shareCopied: string;
  addNextPart: string;
  addNextPartHint: string;
  saveNextPart: string;
  filtersLoading: string;
  filtersEmpty: string;
  onboardingStep1Title: string;
  onboardingStep1Body: string;
  onboardingStep2Title: string;
  onboardingStep2Body: string;
  onboardingStep3Title: string;
  onboardingStep3Body: string;
}> = {
  en: {
    placeholder: "The time I waved back at someone who was waving to the person behind me…",
    submit: "Share anonymously",
    headline: "Stories worth sharing",
    eyebrow: "A little corner for the hilariously human",
    heroCopy: "Awkward moments, tiny triumphs, and stories your group chat still brings up. Share yours anonymously—in English, മലയാളം, or हिन्दी.",
    feedTitle: "The latest stories",
    composeTitle: "Drop your confession",
    composeHint: "Keep it kind, keep it funny. Posts are reviewed before they appear.",
    loading: "Finding the good ones…",
    emptyTitle: "No approved stories in this language yet.",
    emptyPrompt: "Be the first to share a laugh.",
    report: "Report",
    reported: "Reported",
    reportAria: "Report this story",
    storyAria: "Your anonymous story",
    shareAria: "Share a story",
    privacyTitle: "Your identity stays yours",
    privacyCopy: "We don’t ask for a name or email. A random anonymous ID cookie helps prevent duplicate reports. Details are in our privacy policy.",
    latest: "Latest",
    top: "Top",
    random: "Random",
    shareCopyLink: "Copy link",
    shareNative: "Share…",
    shareClose: "Close",
    shareSheetTitle: "Share this story",
    formatToolbar: "Story formatting",
    like: "Like",
    dislike: "Dislike",
    comments: "Comments",
    commentPlaceholder: "Add a kind comment…",
    postComment: "Comment",
    loginToComment: "Log in to join the conversation.",
    loginToReact: "Log in to react to stories.",
    reportError: "We couldn't send that report. Please try again.",
    commentsLoading: "Loading comments…",
    noComments: "No comments yet. Start kindly.",
    viewAllComments: "View all comments",
    trendingTitle: "Trending confessions",
    trendingLoading: "Loading what's hot right now…",
    trendingEmpty: "No trending stories yet—check back after tonight's refresh.",
    trendingByline: "Shared by",
    partLabel: "Part",
    showUsername: "Show my @username on this post",
    showUsernameHint: "Comments always use your handle; stories are anonymous by default.",
    multiPartTitle: "Multi-part story",
    multiPartHint: "Post connected chapters in order (each part is moderated separately).",
    addPart: "Add another part",
    partField: "Part",
    swipeVertical: "Swipe up or down for the next story",
    swipeHorizontal: "Swipe left for the next part",
    searchPlaceholder: "Search stories…",
    searchLabel: "Search confessions",
    filterTitle: "Trending topics",
    clearFilters: "Clear",
    editStory: "Edit story",
    deleteStory: "Delete story",
    saveEdit: "Save",
    cancelEdit: "Cancel",
    editWindowHint: "Authors can edit within 24 hours; updates go to moderation.",
    deleteConfirm: "Delete this story permanently?",
    shareStory: "Share story",
    shareCopied: "Story link copied.",
    addNextPart: "Add next part",
    addNextPartHint: "No time limit—new parts go to moderation like a fresh post.",
    saveNextPart: "Submit next part",
    filtersLoading: "Loading topics…",
    filtersEmpty: "Topics appear as more stories are shared.",
    onboardingStep1Title: "Scroll the feed",
    onboardingStep1Body: "On mobile, swipe up or down to jump between stories like a reel.",
    onboardingStep2Title: "Multi-part stories",
    onboardingStep2Body: "When a story has chapters, swipe sideways to read each part.",
    onboardingStep3Title: "Create & profile",
    onboardingStep3Body: "Use the bottom bar to share a story or manage your account. Language lives in Profile.",
  },
  ml: {
    placeholder: "നിങ്ങളുടെ രസകരമായ അനുഭവം ഇവിടെ എഴുതൂ…",
    submit: "അജ്ഞാതമായി പങ്കിടൂ",
    headline: "പങ്കിടാൻ പറ്റിയ കഥകൾ",
    eyebrow: "ചിരിപ്പിക്കുന്ന ജീവിത നിമിഷങ്ങൾക്കൊരു ചെറിയ ഇടം",
    heroCopy: "ചെറിയ അബദ്ധങ്ങളും വിജയങ്ങളും കൂട്ടുകാർ ഇപ്പോഴും ഓർത്തു ചിരിക്കുന്ന കഥകളും—മലയാളത്തിൽ, ഇംഗ്ലീഷിൽ, അല്ലെങ്കിൽ ഹിന്ദിയിൽ അജ്ഞാതമായി പങ്കിടൂ.",
    feedTitle: "പുതിയ കഥകൾ",
    composeTitle: "നിങ്ങളുടെ കഥ പങ്കിടൂ",
    composeHint: "ദയവായി സൗഹൃദപരവും രസകരവുമായി എഴുതൂ. പ്രസിദ്ധീകരിക്കുന്നതിന് മുമ്പ് കഥകൾ പരിശോധിക്കും.",
    loading: "കഥകൾ കണ്ടെത്തുന്നു…",
    emptyTitle: "ഈ ഭാഷയിൽ അംഗീകരിച്ച കഥകളൊന്നുമില്ല.",
    emptyPrompt: "ആദ്യത്തെ ചിരി നിങ്ങളുടേതാകട്ടെ.",
    report: "റിപ്പോർട്ട്",
    reported: "റിപ്പോർട്ട് ചെയ്തു",
    reportAria: "ഈ കഥ റിപ്പോർട്ട് ചെയ്യുക",
    storyAria: "നിങ്ങളുടെ അജ്ഞാത കഥ",
    shareAria: "ഒരു കഥ പങ്കിടൂ",
    privacyTitle: "നിങ്ങളുടെ സ്വകാര്യത പ്രധാനമാണ്",
    privacyCopy: "പേരോ ഇമെയിലോ ചോദിക്കില്ല. ആവർത്തിച്ചുള്ള റിപ്പോർട്ടുകൾ ഒഴിവാക്കാൻ ക്രമരഹിതമായ അനോണിമസ് ഐഡി കുക്കി ഉപയോഗിക്കുന്നു. സ്വകാര്യതാ നയത്തിൽ കൂടുതൽ വായിക്കാം.",
    latest: "പുതിയത്",
    top: "മികച്ചത്",
    random: "ക്രമരഹിതം",
    shareCopyLink: "ലിങ്ക് കോപ്പി",
    shareNative: "പങ്കിടൂ…",
    shareClose: "അടയ്ക്കുക",
    shareSheetTitle: "ഈ കഥ പങ്കിടൂ",
    formatToolbar: "ഫോർമാറ്റിംഗ്",
    like: "ഇഷ്ടം",
    dislike: "ഇഷ്ടമല്ല",
    comments: "കമന്റുകൾ",
    commentPlaceholder: "സൗഹൃദപരമായൊരു കമന്റ് എഴുതൂ…",
    postComment: "കമന്റ് ചെയ്യൂ",
    loginToComment: "സംഭാഷണത്തിൽ ചേരാൻ ലോഗിൻ ചെയ്യൂ.",
    loginToReact: "കഥകളോട് പ്രതികരിക്കാൻ ലോഗിൻ ചെയ്യൂ.",
    reportError: "റിപ്പോർട്ട് അയയ്ക്കാനായില്ല. വീണ്ടും ശ്രമിക്കൂ.",
    commentsLoading: "കമന്റുകൾ ലോഡ് ചെയ്യുന്നു…",
    noComments: "ഇതുവരെ കമന്റുകളില്ല. സൗഹൃദപരമായി തുടങ്ങൂ.",
    viewAllComments: "എല്ലാ കമന്റുകളും കാണുക",
    trendingTitle: "ട്രെൻഡിംഗ് കഥകൾ",
    trendingLoading: "ഇപ്പോൾ ട്രെൻഡ് ആകുന്നവ ലോഡ് ചെയ്യുന്നു…",
    trendingEmpty: "ഇന്നത്തേ refresh വരെ ട്രെൻഡ് ഇല്ല.",
    trendingByline: "പങ്കിട്ടത്",
    partLabel: "ഭാഗം",
    showUsername: "ഈ പോസ്റ്റിൽ എന്റെ @username കാണിക്കൂ",
    showUsernameHint: "കമന്റുകൾക്ക് handle ഉപയോഗിക്കും; സ്റ്റോറികൾ സാധാരണ അജ്ഞാതമാണ്.",
    multiPartTitle: "ഏറ്റവും ബന്ധപ്പെട്ട ഭാഗങ്ങൾ",
    multiPartHint: "കഥയുടെ ഭാഗങ്ങൾ ക്രമത്തിൽ പോസ്റ്റ് ചെയ്യാം (ഓരോ ഭാഗവും moderation കടന്നുപോകും).",
    addPart: "മറ്റൊരു ഭാഗം ചേർക്കൂ",
    partField: "ഭാഗം",
    swipeVertical: "അടുത്ത കഥയ്ക്ക് മുകളിലേക്ക്/താഴേക്ക് സ്വൈപ്പ് ചെയ്യൂ",
    swipeHorizontal: "അടുത്ത ഭാഗത്തേക്ക് ഇടത്തോട്ട് സ്വൈപ്പ് ചെയ്യൂ",
    searchPlaceholder: "കഥകൾ തിരയൂ…",
    searchLabel: "കഥ തിരയൽ",
    filterTitle: "ട്രെൻഡ് വാക്കുകൾ",
    clearFilters: "മായ്ക്കൂ",
    editStory: "കഥ എഡിറ്റ്",
    deleteStory: "കഥ നീക്കം",
    saveEdit: "സംരക്ഷിക്കൂ",
    cancelEdit: "റദ്ദാക്കൂ",
    editWindowHint: "24 മണിക്കൂറിനുള്ളിൽ മാത്രം എഡിറ്റ്; വീണ്ടും moderation.",
    deleteConfirm: "ഈ കഥ ശാശ്വതമായി നീക്കണോ?",
    shareStory: "കഥ പങ്കിടൂ",
    shareCopied: "ലിങ്ക് കോപ്പി ചെയ്തു.",
    addNextPart: "അടുത്ത ഭാഗം",
    addNextPartHint: "സമയപരിധി ഇല്ല—moderation വീണ്ടും.",
    saveNextPart: "ഭാഗം സമർപ്പിക്കൂ",
    filtersLoading: "വിഷയങ്ങൾ ലോഡ് ചെയ്യുന്നു…",
    filtersEmpty: "കൂടുതൽ കഥകൾ വരുമ്പോൾ ടോപ്പികുകൾ ദൃശ്യമാകും.",
    onboardingStep1Title: "ഫീഡ് സ്ക്രോൾ",
    onboardingStep1Body: "മൊബൈലിൽ മുകളിലേക്ക്/താഴേക്ക് സ്വൈപ്പ് ചെയ്ത് അടുത്ത കഥയിലേക്ക് പോകൂ.",
    onboardingStep2Title: "പല ഭാഗങ്ങളുള്ള കഥ",
    onboardingStep2Body: "ഭാഗങ്ങൾ ഉള്ള കഥകളിൽ വശത്തേക്ക് സ്വൈപ്പ് ചെയ്ത് വായിക്കൂ.",
    onboardingStep3Title: "സൃഷ്ടിക്കൂ & പ്രൊഫൈൽ",
    onboardingStep3Body: "കഥ പങ്കിടാനും അക്കൗണ്ട് നോക്കാനും താഴത്തെ ബാർ. ഭാഷ പ്രൊഫൈലിൽ.",
  },
  hi: {
    placeholder: "अपना मज़ेदार किस्सा यहाँ लिखें…",
    submit: "गुमनाम रूप से साझा करें",
    headline: "साझा करने लायक कहानियाँ",
    eyebrow: "ज़िंदगी के मज़ेदार पलों के लिए एक छोटी-सी जगह",
    heroCopy: "अजीब पल, छोटी जीत और वो किस्से जिन्हें दोस्त अब भी याद करके हँसते हैं—अपनी कहानी अंग्रेज़ी, മലയാളം या हिन्दी में गुमनाम रूप से साझा करें।",
    feedTitle: "नई कहानियाँ",
    composeTitle: "अपना किस्सा साझा करें",
    composeHint: "कहानी को अच्छा और मज़ेदार रखें। प्रकाशित होने से पहले हर पोस्ट की समीक्षा होती है।",
    loading: "कहानियाँ ढूँढ़ रहे हैं…",
    emptyTitle: "इस भाषा में अभी कोई स्वीकृत कहानी नहीं है।",
    emptyPrompt: "हँसी की शुरुआत आप करें।",
    report: "रिपोर्ट करें",
    reported: "रिपोर्ट हो गई",
    reportAria: "इस कहानी की रिपोर्ट करें",
    storyAria: "आपकी गुमनाम कहानी",
    shareAria: "कहानी साझा करें",
    privacyTitle: "आपकी पहचान आपकी है",
    privacyCopy: "हम नाम या ईमेल नहीं माँगते। दोहराई गई रिपोर्ट रोकने के लिए एक यादृच्छिक anonymous ID कुकी उपयोग होती है। जानकारी गोपनीयता नीति में है।",
    latest: "नई",
    top: "टॉप",
    random: "रैंडम",
    shareCopyLink: "लिंक कॉपी करें",
    shareNative: "शेयर करें…",
    shareClose: "बंद करें",
    shareSheetTitle: "यह कहानी साझा करें",
    formatToolbar: "फ़ॉर्मैटिंग",
    like: "पसंद",
    dislike: "नापसंद",
    comments: "टिप्पणियाँ",
    commentPlaceholder: "एक अच्छी टिप्पणी लिखें…",
    postComment: "टिप्पणी करें",
    loginToComment: "बातचीत में शामिल होने के लिए लॉग इन करें।",
    loginToReact: "कहानी पर प्रतिक्रिया देने के लिए लॉग इन करें।",
    reportError: "रिपोर्ट नहीं भेजी जा सकी। फिर से कोशिश करें।",
    commentsLoading: "टिप्पणियाँ लोड हो रही हैं…",
    noComments: "अभी कोई टिप्पणी नहीं। अच्छी शुरुआत करें।",
    viewAllComments: "सारी टिप्पणियाँ देखें",
    trendingTitle: "ट्रेंडिंग कहानियाँ",
    trendingLoading: "अभी ट्रेंड हो रही कहानियाँ लोड हो रही हैं…",
    trendingEmpty: "आज रात की refresh के बाद ट्रेंड दिखेंगे।",
    trendingByline: "शेयर",
    partLabel: "भाग",
    showUsername: "इस पोस्ट पर मेरा @username दिखाएँ",
    showUsernameHint: "टिप्पणियों में हैंडल दिखता है; कहानियाँ डिफ़ॉल्ट में गुमनाम रहती हैं।",
    multiPartTitle: "कई भागों वाली कहानी",
    multiPartHint: "जुड़े हुए भाग क्रम से भेजें (हर भाग अलग से मॉडरेट होगा)।",
    addPart: "एक और भाग जोड़ें",
    partField: "भाग",
    swipeVertical: "अगली कहानी के लिए ऊपर/नीचे स्वाइप करें",
    swipeHorizontal: "अगले भाग के लिए बाएँ स्वाइप करें",
    searchPlaceholder: "कहानियाँ खोजें…",
    searchLabel: "कहानियाँ खोजें",
    filterTitle: "ट्रेंडिंग विषय",
    clearFilters: "हटाएँ",
    editStory: "कहानी संपादित करें",
    deleteStory: "कहानी हटाएँ",
    saveEdit: "सहेजें",
    cancelEdit: "रद्द करें",
    editWindowHint: "24 घंटे के अंदर संपादन; फिर से मॉडरेशन।",
    deleteConfirm: "यह कहानी स्थायी रूप से हटाएँ?",
    shareStory: "कहानी साझा करें",
    shareCopied: "लिंक कॉपी हो गया।",
    addNextPart: "अगला भाग जोड़ें",
    addNextPartHint: "समय की सीमा नहीं—नया भाग फिर मॉडरेशन में जाता है।",
    saveNextPart: "भाग भेजें",
    filtersLoading: "विषय लोड हो रहे हैं…",
    filtersEmpty: "ज़्यादा कहानियों के साथ विषय दिखेंगे।",
    onboardingStep1Title: "फ़ीड स्क्रॉल",
    onboardingStep1Body: "मोबाइल पर ऊपर/नीचे स्वाइप करके अगली कहानी पर जाएँ।",
    onboardingStep2Title: "बहु-भाग कहानी",
    onboardingStep2Body: "जब कहानी के कई भाग हों, बाएँ स्वाइप करके पढ़ें।",
    onboardingStep3Title: "बनाएँ और प्रोफ़ाइल",
    onboardingStep3Body: "नीचे की पट्टी से कहानी साझा करें। भाषा प्रोफ़ाइल में बदलें।",
  },
};

type HomeClientProps = {
  initialFocusId?: string;
  initialLanguage?: LanguageCode;
  syncLanguageFromUrl?: boolean;
};

export default function HomeClient({
  initialFocusId,
  initialLanguage,
  syncLanguageFromUrl = false,
}: HomeClientProps = {}) {
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage ?? "en");
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [multiPart, setMultiPart] = useState(false);
  const [partDrafts, setPartDrafts] = useState<string[]>([""]);
  const [showAuthorOnPost, setShowAuthorOnPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reported, setReported] = useState<string[]>([]);
  const [sort, setSort] = useState<SortMode>("latest");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentError, setCommentError] = useState<Record<string, string>>({});
  const [pendingComment, setPendingComment] = useState<string | null>(null);
  const [votePulse, setVotePulse] = useState<Record<string, "LIKE" | "DISLIKE">>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeToken, setActiveToken] = useState("");
  const [facets, setFacets] = useState<Facet[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [manageError, setManageError] = useState("");
  const [managePending, setManagePending] = useState(false);
  const [appendPostId, setAppendPostId] = useState<string | null>(null);
  const [appendDraft, setAppendDraft] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [shareTarget, setShareTarget] = useState<Post | null>(null);
  const isCompactShare = useMediaQuery("(max-width: 760px)");
  const [facetsLoading, setFacetsLoading] = useState(false);
  const [commentsOpenPostId, setCommentsOpenPostId] = useState<string | null>(null);
  const [focusPostId] = useState(initialFocusId);
  const focusHandled = useRef(false);
  const requestSequence = useRef(0);

  const loadPosts = useCallback(async (
    selectedLanguage: LanguageCode,
    selectedSort: SortMode = sort,
    options?: { q?: string; token?: string },
  ) => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ language: selectedLanguage, sort: selectedSort });
      const q = options?.q ?? debouncedSearch;
      const token = options?.token ?? activeToken;
      if (q.trim()) params.set("q", q.trim());
      if (token.trim()) params.set("token", token.trim());
      const response = await fetch(`/api/posts?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("We couldn't load stories right now.");
      const nextPosts = (await response.json()) as Post[];
      if (requestId === requestSequence.current) {
        setPosts(nextPosts);
        setError("");
      }
    } catch (loadError) {
      if (requestId === requestSequence.current) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load stories.");
      }
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [sort, debouncedSearch, activeToken]);

  useEffect(() => {
    const stored = window.localStorage.getItem("confess-hub-language");
    const fromStorage: LanguageCode = stored === "ml" || stored === "hi" ? stored : "en";
    const resolved = syncLanguageFromUrl && initialLanguage ? initialLanguage : fromStorage;
    setLanguage(resolved);
    if (syncLanguageFromUrl && initialLanguage) {
      window.localStorage.setItem("confess-hub-language", initialLanguage);
      document.documentElement.lang = initialLanguage;
    }
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { user: CurrentUser | null }) => {
        setUser(data.user);
        if (data.user) setShowAuthorOnPost(data.user.showUsernameOnPosts);
      })
      .catch(() => undefined);

    function onLanguageChange(event: Event) {
      const nextLanguage = (event as CustomEvent<LanguageCode>).detail;
      if (nextLanguage === "en" || nextLanguage === "ml" || nextLanguage === "hi") {
        setLanguage(nextLanguage);
        void loadPosts(nextLanguage, sort);
      }
    }

    window.addEventListener("confess-hub-language-change", onLanguageChange);
    return () => window.removeEventListener("confess-hub-language-change", onLanguageChange);
  }, [loadPosts, sort, syncLanguageFromUrl, initialLanguage]);

  const fallbackFacets = useMemo(() => {
    const frequency = new Map<string, number>();
    for (const post of posts) {
      for (const token of extractContentTokens(post.content, language)) {
        frequency.set(token, (frequency.get(token) ?? 0) + 1);
      }
    }
    return [...frequency.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 24)
      .map(([token, count]) => ({ token, frequency: count }));
  }, [posts, language]);

  const displayFacets = facets.length > 0 ? facets : fallbackFacets;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 320);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    void loadPosts(language, sort);
  }, [debouncedSearch, activeToken, language, sort, loadPosts]);

  useEffect(() => {
    setFacetsLoading(true);
    void fetch(`/api/search/facets?language=${language}&limit=24`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          setFacets([]);
          return;
        }
        const data = (await response.json()) as { facets?: Facet[] };
        setFacets(data.facets ?? []);
      })
      .catch(() => setFacets([]))
      .finally(() => setFacetsLoading(false));
  }, [language]);

  const loadComments = useCallback(async (postId: string) => {
    setCommentsLoading((current) => ({ ...current, [postId]: true }));
    setCommentError((current) => ({ ...current, [postId]: "" }));
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, { cache: "no-store" });
      const result = (await response.json()) as Comment[] | { error?: string };
      if (!response.ok) throw new Error("error" in result ? result.error : "Unable to load comments.");
      setComments((current) => ({ ...current, [postId]: result as Comment[] }));
    } catch (commentsError) {
      setCommentError((current) => ({
        ...current,
        [postId]: commentsError instanceof Error ? commentsError.message : "Unable to load comments.",
      }));
    } finally {
      setCommentsLoading((current) => ({ ...current, [postId]: false }));
    }
  }, []);

  useEffect(() => {
    for (const post of posts) {
      if (post.commentCount > 0 && comments[post.id] === undefined && !commentsLoading[post.id]) {
        void loadComments(post.id);
      }
    }
  }, [posts, comments, commentsLoading, loadComments]);

  useEffect(() => {
    if (!focusPostId || focusHandled.current || loading) return;
    const exists = posts.some((post) => post.id === focusPostId);
    if (!exists) {
      void fetch(`/api/posts/${encodeURIComponent(focusPostId)}`, { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) return;
          const data = (await response.json()) as { post?: { id: string; content: string; language: LanguageCode; createdAt: string } };
          if (!data.post) return;
          if (data.post.language !== language) {
            setLanguage(data.post.language);
            window.localStorage.setItem("confess-hub-language", data.post.language);
            document.documentElement.lang = data.post.language;
            return;
          }
          setPosts((current) => {
            if (current.some((post) => post.id === data.post!.id)) return current;
            const placeholder: Post = {
              id: data.post!.id,
              content: data.post!.content,
              language: data.post!.language,
              createdAt: data.post!.createdAt,
              likes: 0,
              dislikes: 0,
              commentCount: 0,
              viewerVote: null,
              seriesId: null,
              partIndex: 1,
              partTotal: null,
              author: null,
              canEdit: false,
              canDelete: false,
              canAppendPart: false,
            };
            return [placeholder, ...current];
          });
        });
      return;
    }
    focusHandled.current = true;
    window.setTimeout(() => {
      document.getElementById(`post-${focusPostId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    void loadComments(focusPostId);
  }, [focusPostId, loading, posts, language, loadComments]);

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parts = multiPart ? partDrafts.map((part) => part.trim()).filter(Boolean) : [];
  const single = content.trim();
    if ((!multiPart && !single) || (multiPart && parts.length === 0) || submitting) return;

    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          showAuthor: showAuthorOnPost,
          ...(multiPart ? { parts } : { content: single }),
        }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Your story couldn't be submitted.");
      setContent("");
      setPartDrafts([""]);
      setMultiPart(false);
      setMessage(result.message ?? "Thanks for sharing. Your story is in the moderation queue.");
      await loadPosts(language);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit your story.");
    } finally {
      setSubmitting(false);
    }
  }

  async function savePostEdit(postId: string) {
    const text = editDraft.trim();
    if (!text || managePending) return;
    setManagePending(true);
    setManageError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const result = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to save edits.");
      setEditingPostId(null);
      setEditDraft("");
      await loadPosts(language, sort);
      setMessage(result.message ?? "Story updated.");
    } catch (saveError) {
      setManageError(saveError instanceof Error ? saveError.message : "Unable to save edits.");
    } finally {
      setManagePending(false);
    }
  }

  async function submitNextPart(postId: string) {
    const text = appendDraft.trim();
    if (!text || managePending) return;
    setManagePending(true);
    setManageError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/next-part`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const result = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to add the next part.");
      setAppendPostId(null);
      setAppendDraft("");
      setMessage(result.message ?? "Next part submitted.");
      await loadPosts(language, sort);
    } catch (appendError) {
      setManageError(appendError instanceof Error ? appendError.message : "Unable to add the next part.");
    } finally {
      setManagePending(false);
    }
  }

  async function sharePost(post: Post) {
    const excerpt = post.content.length > 220 ? `${post.content.slice(0, 217)}…` : post.content;
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/s/${post.id}` : "";
    setShareNotice("");
    if (isCompactShare) {
      setShareTarget(post);
      return;
    }
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "A story on Confess-Hub", text: `${excerpt}\n\n— Confess-Hub`, url: shareUrl });
        return;
      }
    } catch {
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareNotice(labels.shareCopied);
      window.setTimeout(() => setShareNotice(""), 2400);
    } catch {
      setManageError("Unable to share this story.");
    }
  }

  function toggleCommentsPanel(post: Post) {
    if (commentsOpenPostId === post.id) {
      setCommentsOpenPostId(null);
      return;
    }
    setCommentsOpenPostId(post.id);
    if (comments[post.id] === undefined && !commentsLoading[post.id]) {
      void loadComments(post.id);
    }
  }

  async function deletePost(postId: string) {
    if (!window.confirm(labels.deleteConfirm) || managePending) return;
    setManagePending(true);
    setManageError("");
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to delete story.");
      if (editingPostId === postId) {
        setEditingPostId(null);
        setEditDraft("");
      }
      await loadPosts(language, sort);
    } catch (deleteError) {
      setManageError(deleteError instanceof Error ? deleteError.message : "Unable to delete story.");
    } finally {
      setManagePending(false);
    }
  }

  async function reportPost(postId: string) {
    if (reported.includes(postId)) return;
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/report`, { method: "POST" });
      if (!response.ok) throw new Error(labels.reportError);
      setReported((previous) => [...previous, postId]);
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : "Unable to report this story.");
    }
  }

  async function castVote(postId: string, value: "LIKE" | "DISLIKE") {
    if (!user) {
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setVotePulse((current) => ({ ...current, [postId]: value }));
    window.setTimeout(() => {
      setVotePulse((current) => {
        if (current[postId] !== value) return current;
        const next = { ...current };
        delete next[postId];
        return next;
      });
    }, 520);
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "We couldn't save your reaction.");
      await loadPosts(language, sort);
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : "Unable to save your reaction.");
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    if (!user) {
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const text = (commentDrafts[postId] ?? "").trim();
    if (!text || pendingComment) return;
    setPendingComment(postId);
    setCommentError((current) => ({ ...current, [postId]: "" }));
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const result = (await response.json()) as Comment | { error?: string };
      if (!response.ok) throw new Error("error" in result ? result.error : "Unable to post comment.");
      const createdComment = result as Comment;
      setComments((current) => ({
        ...current,
        [postId]: [...(current[postId] ?? []), createdComment],
      }));
      setPosts((current) => current.map((post) => post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post));
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    } catch (submitError) {
      setCommentError((current) => ({
        ...current,
        [postId]: submitError instanceof Error ? submitError.message : "Unable to post comment.",
      }));
    } finally {
      setPendingComment(null);
    }
  }

  const labels = copy[language];
  const locale = language === "ml" ? "ml-IN" : language === "hi" ? "hi-IN" : "en-IN";

  const feedGroups = useMemo(() => {
    const seenSeries = new Set<string>();
    const groups: Array<Post | Post[]> = [];
    for (const post of posts) {
      if (post.seriesId && post.partTotal && post.partTotal > 1) {
        if (seenSeries.has(post.seriesId)) continue;
        seenSeries.add(post.seriesId);
        groups.push(
          posts
            .filter((item) => item.seriesId === post.seriesId)
            .sort((left, right) => left.partIndex - right.partIndex),
        );
      } else {
        groups.push(post);
      }
    }
    return groups;
  }, [posts]);

  function renderAppendPartBox(post: Post) {
    if (appendPostId !== post.id) return null;
    return (
      <div className="post-edit-box post-append-box">
        <p className="field-hint">{labels.addNextPartHint}</p>
        <RichTextEditor
          value={appendDraft}
          onChange={setAppendDraft}
          maxLength={2000}
          rows={5}
          placeholder={labels.placeholder}
          toolbarLabel={labels.formatToolbar}
        />
        <div className="post-edit-actions">
          <button type="button" className="text-button" onClick={() => { setAppendPostId(null); setAppendDraft(""); }}>
            {labels.cancelEdit}
          </button>
          <button type="button" className="primary-button" onClick={() => void submitNextPart(post.id)} disabled={managePending || !appendDraft.trim()}>
            {labels.saveNextPart}
          </button>
        </div>
      </div>
    );
  }

  function renderManageToolbar(post: Post) {
    if (!post.canEdit && !post.canDelete && !post.canAppendPart) return null;
    return (
      <div className="post-manage" aria-label="Story options">
        {post.canEdit ? (
          <Tooltip label={labels.editStory}>
            <button
              type="button"
              className="reaction-button icon-only"
              onClick={() => {
                setEditingPostId(post.id);
                setEditDraft(post.content);
                setManageError("");
              }}
            >
              <IconEdit />
            </button>
          </Tooltip>
        ) : null}
        {post.canAppendPart ? (
          <Tooltip label={labels.addNextPart}>
            <button
              type="button"
              className="reaction-button icon-only"
              onClick={() => {
                setAppendPostId(post.id);
                setAppendDraft("");
                setEditingPostId(null);
                setManageError("");
              }}
            >
              <span className="append-part-label">+</span>
            </button>
          </Tooltip>
        ) : null}
        {post.canDelete ? (
          <Tooltip label={labels.deleteStory}>
            <button
              type="button"
              className="reaction-button icon-only danger"
              onClick={() => void deletePost(post.id)}
              disabled={managePending}
            >
              <IconTrash />
            </button>
          </Tooltip>
        ) : null}
      </div>
    );
  }

  function renderStoryBody(post: Post, partOnly = false) {
    if (editingPostId === post.id) {
      return (
        <div className="post-edit-box">
          <RichTextEditor
            value={editDraft}
            onChange={setEditDraft}
            maxLength={2000}
            rows={partOnly ? 5 : 6}
            toolbarLabel={labels.formatToolbar}
            aria-label={labels.storyAria}
          />
          <p className="field-hint">{labels.editWindowHint}</p>
          <div className="post-edit-actions">
            <button type="button" className="text-button" onClick={() => { setEditingPostId(null); setEditDraft(""); }}>
              {labels.cancelEdit}
            </button>
            <button type="button" className="primary-button" onClick={() => void savePostEdit(post.id)} disabled={managePending || !editDraft.trim()}>
              {labels.saveEdit}
            </button>
          </div>
        </div>
      );
    }
    if (partOnly) return <RichTextContent content={post.content} className="rich-text snap-part-text" />;
    return <RichTextContent content={post.content} />;
  }

  function renderPostCard(post: Post, options?: { inSeries?: boolean; partOnly?: boolean }) {
    const inSeries = options?.inSeries ?? false;
    const partOnly = options?.partOnly ?? false;
    if (partOnly) {
      return (
        <>
          <div id={`post-${post.id}`} className="post-anchor" aria-hidden="true" />
          {renderManageToolbar(post)}
          {renderStoryBody(post, true)}
          {renderAppendPartBox(post)}
        </>
      );
    }
    return (
      <>
        <div id={`post-${post.id}`} className="post-anchor" aria-hidden="true" />
        {(post.canEdit || post.canDelete || post.canAppendPart) ? renderManageToolbar(post) : null}
        {!inSeries && post.partTotal && post.partTotal > 1 ? (
          <p className="series-badge">{labels.partLabel} {post.partIndex}/{post.partTotal}</p>
        ) : null}
        {!inSeries && post.author ? (
          <p className="post-author-line">
            {labels.trendingByline} <strong>@{post.author.username}</strong>
          </p>
        ) : null}
        {!inSeries ? renderStoryBody(post) : null}
        {!inSeries ? renderAppendPartBox(post) : null}
        <footer className="post-meta">
          <span className="post-language">{languageNames[post.language]}</span>
          <time dateTime={post.createdAt}>
            {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(post.createdAt))}
          </time>
        </footer>
        <div className="post-actions" aria-label="Story reactions">
          <Tooltip label={`${labels.like} · ${post.likes}`}>
            <button
              type="button"
              className={[
                post.viewerVote === "LIKE" ? "reaction-button icon-only selected" : "reaction-button icon-only",
                votePulse[post.id] === "LIKE" ? "action-pop" : "",
              ].filter(Boolean).join(" ")}
              aria-pressed={post.viewerVote === "LIKE"}
              onClick={() => void castVote(post.id, "LIKE")}
            >
              <IconThumbUp />
              <span className="reaction-count">{post.likes}</span>
            </button>
          </Tooltip>
          <Tooltip label={`${labels.dislike} · ${post.dislikes}`}>
            <button
              type="button"
              className={[
                post.viewerVote === "DISLIKE" ? "reaction-button icon-only selected" : "reaction-button icon-only",
                votePulse[post.id] === "DISLIKE" ? "action-pop" : "",
              ].filter(Boolean).join(" ")}
              aria-pressed={post.viewerVote === "DISLIKE"}
              onClick={() => void castVote(post.id, "DISLIKE")}
            >
              <IconThumbDown />
              <span className="reaction-count">{post.dislikes}</span>
            </button>
          </Tooltip>
          <Tooltip label={`${labels.comments} · ${post.commentCount}`}>
            <button
              type="button"
              className={commentsOpenPostId === post.id ? "reaction-button icon-only selected" : "reaction-button icon-only"}
              aria-pressed={commentsOpenPostId === post.id}
              onClick={() => toggleCommentsPanel(post)}
            >
              <IconComment />
              <span className="reaction-count">{post.commentCount}</span>
            </button>
          </Tooltip>
          <Tooltip label={labels.shareStory}>
            <button
              type="button"
              className="reaction-button icon-only"
              onClick={() => void sharePost(post)}
            >
              <IconShare />
            </button>
          </Tooltip>
          <div className="post-actions-flag">
            <Tooltip label={reported.includes(post.id) ? labels.reported : labels.report}>
              <button
                className="report-button icon-only"
                type="button"
                onClick={() => void reportPost(post.id)}
                disabled={reported.includes(post.id)}
              >
                <IconFlag />
                <span className="sr-only">{reported.includes(post.id) ? labels.reported : labels.report}</span>
              </button>
            </Tooltip>
          </div>
        </div>
        {inSeries ? renderAppendPartBox(post) : null}
        {renderComments(post)}
      </>
    );
  }

  function renderComments(post: Post) {
    const composerOpen = commentsOpenPostId === post.id;
    return (
      <section className="ig-comments ig-comments--open" aria-label={labels.comments}>
        {post.commentCount > 0 && comments[post.id] === undefined && !commentsLoading[post.id] && (
          <button className="ig-view-all" type="button" onClick={() => void loadComments(post.id)}>
            {commentsLoading[post.id] ? labels.commentsLoading : `${labels.viewAllComments} (${post.commentCount})`}
          </button>
        )}
        <div className="ig-comments-scroll">
          {commentsLoading[post.id] && !comments[post.id] && (
            <p className="comments-empty">{labels.commentsLoading}</p>
          )}
          {(comments[post.id] ?? []).map((comment) => (
            <article className="ig-comment" key={comment.id}>
              <span className="ig-comment-avatar" aria-hidden="true">{avatarInitial(comment.user)}</span>
              <div className="ig-comment-body">
                <p className="ig-comment-text">
                  <span className="ig-comment-user">{comment.user.displayName}</span>
                  <span className="ig-comment-handle">@{comment.user.username}</span>
                  <span className="ig-comment-copy">{comment.content}</span>
                </p>
                <time className="ig-comment-time" dateTime={comment.createdAt}>{formatTimeAgo(comment.createdAt, locale)}</time>
              </div>
            </article>
          ))}
          {comments[post.id]?.length === 0 && (
            <p className="comments-empty">{labels.noComments}</p>
          )}
          {post.commentCount === 0 && comments[post.id] === undefined && (
            <p className="comments-empty">{labels.noComments}</p>
          )}
        </div>
        {composerOpen && !user ? (
          <p className="login-prompt ig-login-prompt">
            <Link href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/")}`}>{labels.loginToComment}</Link>
          </p>
        ) : null}
        {composerOpen ? (
          <form className="ig-comment-form ig-comment-form--desktop" onSubmit={(event) => void submitComment(event, post.id)}>
            <span className="ig-comment-avatar ig-comment-avatar-self" aria-hidden="true">
              {user ? avatarInitial(user) : "?"}
            </span>
            <label className="sr-only" htmlFor={`comment-${post.id}`}>{labels.commentPlaceholder}</label>
            <input
              id={`comment-${post.id}`}
              className="ig-comment-input"
              value={commentDrafts[post.id] ?? ""}
              onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
              maxLength={1000}
              placeholder={labels.commentPlaceholder}
              autoComplete="off"
              disabled={!user}
            />
            <Tooltip label={labels.postComment} side="top">
              <button
                className={[
                  "ig-comment-post icon-only",
                  pendingComment === post.id ? "action-pop" : "",
                ].filter(Boolean).join(" ")}
                type="submit"
                disabled={!user || pendingComment === post.id || !(commentDrafts[post.id] ?? "").trim()}
              >
                <IconSend />
              </button>
            </Tooltip>
          </form>
        ) : null}
        {commentError[post.id] && (
          <p className="status-message status-error" role="alert">{commentError[post.id]}</p>
        )}
      </section>
    );
  }

  const onboardingSteps = [
    { title: labels.onboardingStep1Title, body: labels.onboardingStep1Body, icon: "↕" },
    { title: labels.onboardingStep2Title, body: labels.onboardingStep2Body, icon: "↔" },
    { title: labels.onboardingStep3Title, body: labels.onboardingStep3Body, icon: "✦" },
  ];

  return (
    <div className="page-shell page-shell--feed" lang={language}>
      <FeedOnboarding steps={onboardingSteps} />
      {user ? (
        <TrendingCarousel
          language={language}
          title={labels.trendingTitle}
          loadingLabel={labels.trendingLoading}
          emptyLabel={labels.trendingEmpty}
          bylinePrefix={labels.trendingByline}
          partLabel={(index, total) => `${labels.partLabel} ${index}${total ? `/${total}` : ""}`}
        />
      ) : (
        <section className="hero desktop-hero" aria-labelledby="hero-title">
          <p className="eyebrow">{labels.eyebrow}</p>
          <h1 id="hero-title">{labels.headline}.<br /><span>{language === "ml" ? "പേരില്ല, ചിരി മാത്രം." : language === "hi" ? "नाम नहीं, बस हँसी।" : "No names, just laughs."}</span></h1>
          <p className="hero-copy">{labels.heroCopy}</p>
        </section>
      )}

      <div className="content-grid">
        <section aria-labelledby="feed-title">
          <div className="feed-search-block">
            <label className="feed-search" htmlFor="feed-search-input">
              <span className="sr-only">{labels.searchLabel}</span>
              <input
                id="feed-search-input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={labels.searchPlaceholder}
                maxLength={120}
                autoComplete="off"
              />
            </label>
            <div className="feed-filters" aria-label={labels.filterTitle}>
              <span className="feed-filters-label">{labels.filterTitle}</span>
              {facetsLoading && displayFacets.length === 0 ? (
                <p className="field-hint">{labels.filtersLoading}</p>
              ) : null}
              {!facetsLoading && displayFacets.length === 0 ? (
                <p className="field-hint">{labels.filtersEmpty}</p>
              ) : null}
              {displayFacets.length > 0 ? (
                <div className="feed-filter-chips">
                  {displayFacets.map((facet) => (
                    <button
                      key={facet.token}
                      type="button"
                      className={activeToken === facet.token ? "filter-chip active" : "filter-chip"}
                      onClick={() => setActiveToken((current) => (current === facet.token ? "" : facet.token))}
                    >
                      {facet.token}
                      <span className="filter-chip-count">{facet.frequency}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {activeToken || debouncedSearch ? (
                <button
                  type="button"
                  className="text-button filter-clear"
                  onClick={() => { setSearchQuery(""); setActiveToken(""); }}
                >
                  {labels.clearFilters}
                </button>
              ) : null}
            </div>
          </div>
          {shareNotice ? <p className="status-message" role="status">{shareNotice}</p> : null}
          {manageError ? <p className="status-message status-error" role="alert">{manageError}</p> : null}
          <div className="section-heading">
            <h2 id="feed-title">{labels.feedTitle}</h2>
            <div className="feed-controls">
              <span className="count-label">{loading ? labels.loading : `${posts.length} ${language === "ml" ? "കഥകൾ" : language === "hi" ? "कहानियाँ" : "shared"}`}</span>
              <div className="sort-tabs" role="group" aria-label="Sort stories">
                <Tooltip label={labels.latest}>
                  <button type="button" className={sort === "latest" ? "sort-tab active" : "sort-tab"} aria-pressed={sort === "latest"} onClick={() => { setSort("latest"); void loadPosts(language, "latest"); }}>{labels.latest}</button>
                </Tooltip>
                <Tooltip label={labels.top}>
                  <button type="button" className={sort === "top" ? "sort-tab active" : "sort-tab"} aria-pressed={sort === "top"} onClick={() => { setSort("top"); void loadPosts(language, "top"); }}>{labels.top}</button>
                </Tooltip>
                <Tooltip label={labels.random}>
                  <button type="button" className={sort === "random" ? "sort-tab active" : "sort-tab"} aria-pressed={sort === "random"} onClick={() => { setSort("random"); void loadPosts(language, "random"); }}>{labels.random}</button>
                </Tooltip>
              </div>
            </div>
          </div>
          {error && <p className="status-message status-error" role="alert">{error}</p>}
          {loading ? (
            <div className="empty-state" aria-live="polite">{labels.loading}</div>
          ) : posts.length ? (
            <>
            <MobileSnapFeed
              groups={feedGroups}
              renderItem={(post, options) => renderPostCard(post, options)}
              renderSeriesMeta={(part, total) => (
                <>
                  <p className="series-badge">{labels.partLabel} {part.partIndex}/{total}</p>
                  {part.author ? (
                    <p className="post-author-line">{labels.trendingByline} <strong>@{part.author.username}</strong></p>
                  ) : null}
                </>
              )}
            />
            <div className="feed-list feed-list--classic">
              {feedGroups.map((group) => {
                if (Array.isArray(group)) {
                  const actionPost = group[group.length - 1];
                  return (
                    <article className="post-card series-card" key={group[0].seriesId ?? group[0].id}>
                      <p className="series-badge">{labels.partLabel} 1–{group.length}</p>
                      {group.map((part) => (
                        <div className="series-part" key={part.id}>
                          <p className="series-part-label">{labels.partField} {part.partIndex}</p>
                          {part.author ? (
                            <p className="post-author-line">{labels.trendingByline} <strong>@{part.author.username}</strong></p>
                          ) : null}
                          {renderManageToolbar(part)}
                          {editingPostId === part.id ? renderStoryBody(part) : <RichTextContent content={part.content} />}
                        </div>
                      ))}
                      {renderPostCard(actionPost, { inSeries: true })}
                    </article>
                  );
                }
                return (
                  <article className="post-card" key={group.id} id={`post-${group.id}`}>
                    {renderPostCard(group)}
                  </article>
                );
              })}
            </div>
            </>
          ) : (
            <div className="empty-state">{labels.emptyTitle}<br />{labels.emptyPrompt}</div>
          )}
        </section>

        <aside className="compose-column" id="compose-anchor" aria-label={labels.shareAria}>
          <form className="compose-card animate-rise" onSubmit={submitPost}>
            <h2>{labels.composeTitle}</h2>
            <p className="compose-hint">{labels.composeHint}</p>
            {user ? (
              <label className="compose-choice">
                <input
                  type="checkbox"
                  checked={showAuthorOnPost}
                  onChange={(event) => setShowAuthorOnPost(event.target.checked)}
                />
                <span>{labels.showUsername}</span>
              </label>
            ) : null}
            {user ? <p className="field-hint compose-choice-hint">{labels.showUsernameHint}</p> : null}
            <label className="compose-choice">
              <input
                type="checkbox"
                checked={multiPart}
                onChange={(event) => {
                  setMultiPart(event.target.checked);
                  if (!event.target.checked) setPartDrafts([""]);
                }}
              />
              <span>{labels.multiPartTitle}</span>
            </label>
            {multiPart ? <p className="field-hint compose-choice-hint">{labels.multiPartHint}</p> : null}
            {multiPart ? (
              <div className="compose-parts">
                {partDrafts.map((part, index) => (
                  <p key={`part-${index}`} className="compose-part-field">
                    <label htmlFor={`story-part-${index}`}>{labels.partField} {index + 1}</label>
                    <RichTextEditor
                      id={`story-part-${index}`}
                      className="compose-field compose-part"
                      value={part}
                      onChange={(value) => setPartDrafts((current) => current.map((draft, idx) => (idx === index ? value : draft)))}
                      placeholder={labels.placeholder}
                      maxLength={2000}
                      required={index === 0}
                      lang={language}
                      toolbarLabel={labels.formatToolbar}
                    />
                  </p>
                ))}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setPartDrafts((current) => (current.length < 12 ? [...current, ""] : current))}
                  disabled={partDrafts.length >= 12}
                >
                  {labels.addPart}
                </button>
              </div>
            ) : (
              <>
                <label className="sr-only" htmlFor="story-content">{labels.storyAria}</label>
                <RichTextEditor
                  id="story-content"
                  value={content}
                  onChange={setContent}
                  placeholder={labels.placeholder}
                  maxLength={2000}
                  required
                  lang={language}
                  aria-describedby="story-count"
                  toolbarLabel={labels.formatToolbar}
                />
              </>
            )}
            <div className="compose-footer">
              <span id="story-count">
                {multiPart
                  ? `${partDrafts.reduce((sum, part) => sum + part.length, 0)} chars · ${partDrafts.filter((part) => part.trim()).length} parts`
                  : `${content.length}/2000`}
              </span>
              <button
                className="primary-button"
                type="submit"
                disabled={submitting || (multiPart ? partDrafts.every((part) => !part.trim()) : !content.trim())}
              >
                {submitting ? "Sending…" : labels.submit}
              </button>
            </div>
            {message && <p className="status-message" role="status">{message}</p>}
            {error && <p className="status-message status-error" role="alert">{error}</p>}
          </form>
          <div className="side-card">
            <strong>{labels.privacyTitle}</strong>
            <p>{labels.privacyCopy} <a href="/legal/privacy">{language === "ml" ? "കൂടുതൽ വായിക്കൂ" : language === "hi" ? "और पढ़ें" : "Read more"}</a></p>
          </div>
        </aside>
      </div>
      {commentsOpenPostId ? (
        user ? (
          <form
            className="comment-dock"
            onSubmit={(event) => void submitComment(event, commentsOpenPostId)}
          >
            <span className="ig-comment-avatar ig-comment-avatar-self" aria-hidden="true">{avatarInitial(user)}</span>
            <label className="sr-only" htmlFor="comment-dock-input">{labels.commentPlaceholder}</label>
            <input
              id="comment-dock-input"
              className="comment-dock-input"
              value={commentDrafts[commentsOpenPostId] ?? ""}
              onChange={(event) => setCommentDrafts((current) => ({ ...current, [commentsOpenPostId]: event.target.value }))}
              maxLength={1000}
              placeholder={labels.commentPlaceholder}
              autoComplete="off"
            />
            <button
              type="submit"
              className="comment-dock-send"
              disabled={pendingComment === commentsOpenPostId || !(commentDrafts[commentsOpenPostId] ?? "").trim()}
              aria-label={labels.postComment}
            >
              <IconSend />
            </button>
          </form>
        ) : (
          <p className="comment-dock comment-dock-login">
            <Link href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/")}`}>{labels.loginToComment}</Link>
          </p>
        )
      ) : null}
      {shareTarget ? (
        <ShareSheet
          open
          title={labels.shareSheetTitle}
          excerpt={shareTarget.content.length > 160 ? `${shareTarget.content.slice(0, 157)}…` : shareTarget.content}
          url={typeof window !== "undefined" ? `${window.location.origin}/s/${shareTarget.id}` : ""}
          copyLabel={labels.shareCopyLink}
          shareLabel={labels.shareNative}
          closeLabel={labels.shareClose}
          copiedLabel={labels.shareCopied}
          onClose={() => setShareTarget(null)}
          onCopied={() => {
            setShareNotice(labels.shareCopied);
            window.setTimeout(() => setShareNotice(""), 2400);
          }}
        />
      ) : null}
    </div>
  );
}
