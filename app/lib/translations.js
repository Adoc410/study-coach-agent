/**
 * Uganda AI Study Coach — UI Translations
 * Supported languages: English + 9 international languages
 * All strings use backtick literals to avoid quote conflicts.
 */

const STRINGS = {

  appName: {
    English:`AI Study Coach`, Swahili:`Kocha wa AI`, French:`Coach IA`,
    Spanish:`Coach de IA`, German:`KI-Lerncoach`, Portuguese:`Coach de IA`,
    Arabic:`مدرب الذكاء الاصطناعي`, Chinese:`AI学习助手`,
    Hindi:`AI स्टडी कोच`, Japanese:`AI学習コーチ`,
  },

  student: {
    English:`Student`, Swahili:`Mwanafunzi`, French:`Étudiant`,
    Spanish:`Estudiante`, German:`Schüler`, Portuguese:`Estudante`,
    Arabic:`طالب`, Chinese:`学生`, Hindi:`छात्र`, Japanese:`学生`,
  },

  signOut: {
    English:`Sign out`, Swahili:`Toka`, French:`Se déconnecter`,
    Spanish:`Cerrar sesión`, German:`Abmelden`, Portuguese:`Sair`,
    Arabic:`تسجيل الخروج`, Chinese:`退出`, Hindi:`साइन आउट`, Japanese:`サインアウト`,
  },

  welcomeGreeting: {
    English:`Hi there! I am your **AI Study Coach** 🎓\n\nI can:\n- Explain any topic with real facts\n- Quiz you with multiple choice questions\n- Track your progress and weak areas\n- Generate educational images\n- Browse the Uganda O-Level curriculum\n\nWhat are you studying today?`,
    Swahili:`Habari! Mimi ni **Kocha wako wa AI** 🎓\n\nNinaweza:\n- Kueleza mada yoyote kwa ukweli\n- Kukuuliza maswali ya kuchagua\n- Kufuatilia maendeleo yako\n- Kutengeneza picha za elimu\n- Kuvinjari mtaala wa Uganda\n\nUnasomea nini leo?`,
    French:`Bonjour! Je suis votre **Coach IA** 🎓\n\nJe peux:\n- Expliquer n'importe quel sujet\n- Vous tester avec des QCM\n- Suivre vos progrès\n- Générer des images éducatives\n- Parcourir le programme ougandais\n\nQue étudiez-vous aujourd'hui?`,
    Spanish:`Hola! Soy tu **Coach de IA** 🎓\n\nPuedo:\n- Explicar cualquier tema\n- Hacerte preguntas de opción múltiple\n- Seguir tu progreso\n- Generar imágenes educativas\n- Explorar el currículo de Uganda\n\nQué estudias hoy?`,
    German:`Hallo! Ich bin dein **KI-Lerncoach** 🎓\n\nIch kann:\n- Jedes Thema erklären\n- Dich mit Multiple-Choice testen\n- Deinen Fortschritt verfolgen\n- Lernbilder erstellen\n- Den Uganda-Lehrplan durchsuchen\n\nWas lernst du heute?`,
    Portuguese:`Olá! Sou seu **Coach de IA** 🎓\n\nPosso:\n- Explicar qualquer tema\n- Fazer perguntas de múltipla escolha\n- Acompanhar seu progresso\n- Gerar imagens educacionais\n- Navegar no currículo de Uganda\n\nO que você está estudando hoje?`,
    Arabic:`مرحبا! أنا مدرب الذكاء الاصطناعي الخاص بك 🎓\n\nأستطيع:\n- شرح أي موضوع بحقائق حقيقية\n- اختبارك بأسئلة متعددة الخيارات\n- تتبع تقدمك\n- إنشاء صور تعليمية\n- تصفح المنهج الأوغندي\n\nماذا تدرس اليوم؟`,
    Chinese:`你好！我是你的AI学习助手 🎓\n\n我可以：\n- 用真实事实解释任何主题\n- 用选择题测试你\n- 跟踪你的进度\n- 生成教育图片\n- 浏览乌干达课程\n\n你今天在学什么？`,
    Hindi:`नमस्ते! मैं आपका AI स्टडी कोच हूं 🎓\n\nमैं कर सकता हूं:\n- किसी भी विषय को समझाना\n- MCQ प्रश्नों से परीक्षण\n- प्रगति को ट्रैक करना\n- शैक्षिक चित्र बनाना\n- युगांडा पाठ्यक्रम देखना\n\nआज आप क्या पढ़ रहे हैं?`,
    Japanese:`こんにちは！あなたのAI学習コーチです 🎓\n\nできること:\n- どんなトピックも説明\n- 選択問題でテスト\n- 進捗を追跡\n- 教育画像を生成\n- ウガンダのカリキュラムを閲覧\n\n今日は何を勉強していますか？`,
  },

  inputPlaceholder: {
    English:`Ask a question, say 'quiz me on', or type anything`,
    Swahili:`Uliza swali, sema niniulize kuhusu`,
    French:`Posez une question ou dites testez-moi sur`,
    Spanish:`Haz una pregunta o di ponme a prueba sobre`,
    German:`Stelle eine Frage oder sage teste mich ueber`,
    Portuguese:`Faca uma pergunta ou diga me teste sobre`,
    Arabic:`اطرح سؤالا او قل اختبرني في`,
    Chinese:`提问，或说测试我关于某主题`,
    Hindi:`कोई प्रश्न पूछें या कहें मुझे क्विज़ करें`,
    Japanese:`質問するかクイズしてと入力`,
  },

  send: {
    English:`Send`, Swahili:`Tuma`, French:`Envoyer`, Spanish:`Enviar`,
    German:`Senden`, Portuguese:`Enviar`, Arabic:`إرسال`,
    Chinese:`发送`, Hindi:`भेजें`, Japanese:`送信`,
  },

  enterToSend: {
    English:`Enter to send · Shift+Enter for new line`,
    Swahili:`Enter kutuma · Shift+Enter mstari mpya`,
    French:`Entrée pour envoyer · Maj+Entrée nouvelle ligne`,
    Spanish:`Enter para enviar · Shift+Enter nueva línea`,
    German:`Enter senden · Shift+Enter neue Zeile`,
    Portuguese:`Enter para enviar · Shift+Enter nova linha`,
    Arabic:`Enter للإرسال · Shift+Enter سطر جديد`,
    Chinese:`Enter发送，Shift+Enter换行`,
    Hindi:`Enter भेजने के लिए · Shift+Enter नई लाइन`,
    Japanese:`Enter送信・Shift+Enter改行`,
  },

  tryOne: {
    English:`Try one of these to get started:`,
    Swahili:`Jaribu moja ya hizi kuanza:`,
    French:`Essayez l'un de ces éléments pour commencer:`,
    Spanish:`Prueba uno de estos para empezar:`,
    German:`Probiere eines davon zum Einstieg:`,
    Portuguese:`Tente um desses para começar:`,
    Arabic:`جرب احد هذه للبدء:`,
    Chinese:`试试这些开始吧：`,
    Hindi:`शुरू करने के लिए इनमें से एक आज़माएं:`,
    Japanese:`始めるためにひとつ試してみて：`,
  },

  sug1: {
    English:`Explain photosynthesis simply`, Swahili:`Eleza usanisinuru kwa urahisi`,
    French:`Explique la photosynthèse simplement`, Spanish:`Explica la fotosíntesis`,
    German:`Erkläre die Photosynthese einfach`, Portuguese:`Explique a fotossíntese`,
    Arabic:`اشرح عملية التمثيل الضوئي ببساطة`, Chinese:`简单解释光合作用`,
    Hindi:`प्रकाश संश्लेषण को सरल रूप में समझाएं`, Japanese:`光合成を簡単に説明して`,
  },

  sug2: {
    English:`Quiz me on World War II`, Swahili:`Niniulize kuhusu Vita vya Pili vya Dunia`,
    French:`Testez-moi sur la Seconde Guerre mondiale`, Spanish:`Ponme a prueba sobre la Segunda Guerra Mundial`,
    German:`Teste mich über den Zweiten Weltkrieg`, Portuguese:`Me teste sobre a Segunda Guerra Mundial`,
    Arabic:`اختبرني في الحرب العالمية الثانية`, Chinese:`考我关于二战的知识`,
    Hindi:`द्वितीय विश्व युद्ध पर क्विज़ करें`, Japanese:`第二次世界大戦についてクイズして`,
  },

  sug3: {
    English:`How does the water cycle work?`, Swahili:`Mzunguko wa maji unafanyaje kazi?`,
    French:`Comment fonctionne le cycle de l'eau?`, Spanish:`¿Cómo funciona el ciclo del agua?`,
    German:`Wie funktioniert der Wasserkreislauf?`, Portuguese:`Como funciona o ciclo da água?`,
    Arabic:`كيف تعمل دورة المياه؟`, Chinese:`水循环是如何运作的？`,
    Hindi:`जल चक्र कैसे काम करता है?`, Japanese:`水循環の仕組みは？`,
  },

  sug4: {
    English:`Teach me about Newton's Laws`, Swahili:`Nifundishe kuhusu Sheria za Newton`,
    French:`Apprenez-moi les lois de Newton`, Spanish:`Enséñame sobre las leyes de Newton`,
    German:`Lehre mich Newtons Gesetze`, Portuguese:`Me ensine as Leis de Newton`,
    Arabic:`علمني قوانين نيوتن`, Chinese:`教我牛顿定律`,
    Hindi:`न्यूटन के नियम सिखाएं`, Japanese:`ニュートンの法則を教えて`,
  },

  sug5: {
    English:`Quiz me on basic algebra`, Swahili:`Niniulize kuhusu aljebra ya msingi`,
    French:`Testez-moi sur l'algèbre de base`, Spanish:`Ponme a prueba en álgebra básica`,
    German:`Teste mich in der Grundalgebra`, Portuguese:`Me teste em álgebra básica`,
    Arabic:`اختبرني في الجبر الأساسي`, Chinese:`考我基础代数`,
    Hindi:`बुनियादी बीजगणित पर क्विज़ करें`, Japanese:`基礎代数でクイズして`,
  },

  sug6: {
    English:`What should I study next?`, Swahili:`Ninapaswa kusomea nini kinachofuata?`,
    French:`Que devrais-je étudier ensuite?`, Spanish:`¿Qué debería estudiar a continuación?`,
    German:`Was soll ich als nächstes lernen?`, Portuguese:`O que devo estudar a seguir?`,
    Arabic:`ماذا يجب أن أدرس بعد ذلك؟`, Chinese:`我接下来应该学什么？`,
    Hindi:`मुझे आगे क्या पढ़ना चाहिए?`, Japanese:`次は何を勉強すべきですか？`,
  },

  browseCurriculum: {
    English:`Browse Curriculum`, Swahili:`Vinjari Mtaala`, French:`Parcourir le programme`,
    Spanish:`Ver el currículo`, German:`Lehrplan durchsuchen`, Portuguese:`Ver currículo`,
    Arabic:`تصفح المنهج`, Chinese:`浏览课程`, Hindi:`पाठ्यक्रम देखें`, Japanese:`カリキュラムを見る`,
  },

  myProgress: {
    English:`My Progress`, Swahili:`Maendeleo Yangu`, French:`Mes progrès`,
    Spanish:`Mi progreso`, German:`Mein Fortschritt`, Portuguese:`Meu progresso`,
    Arabic:`تقدمي`, Chinese:`我的进度`, Hindi:`मेरी प्रगति`, Japanese:`私の進捗`,
  },

  generateImage: {
    English:`Generate Image`, Swahili:`Tengeneza Picha`, French:`Générer une image`,
    Spanish:`Generar imagen`, German:`Bild generieren`, Portuguese:`Gerar imagem`,
    Arabic:`توليد صورة`, Chinese:`生成图片`, Hindi:`छवि उत्पन्न करें`, Japanese:`画像を生成`,
  },

  setReminder: {
    English:`Set Reminder`, Swahili:`Weka Ukumbusho`, French:`Définir un rappel`,
    Spanish:`Establecer recordatorio`, German:`Erinnerung setzen`, Portuguese:`Definir lembrete`,
    Arabic:`ضبط تذكير`, Chinese:`设置提醒`, Hindi:`अनुस्मारक सेट करें`, Japanese:`リマインダーを設定`,
  },

  newChat: {
    English:`+ New Chat`, Swahili:`+ Mazungumzo Mapya`, French:`+ Nouvelle discussion`,
    Spanish:`+ Nueva conversación`, German:`+ Neues Gespräch`, Portuguese:`+ Nova conversa`,
    Arabic:`+ محادثة جديدة`, Chinese:`+ 新对话`, Hindi:`+ नई चैट`, Japanese:`+ 新しいチャット`,
  },

  recentChats: {
    English:`Recent Chats`, Swahili:`Mazungumzo ya Hivi Karibuni`, French:`Discussions récentes`,
    Spanish:`Conversaciones recientes`, German:`Letzte Gespräche`, Portuguese:`Conversas recentes`,
    Arabic:`المحادثات الأخيرة`, Chinese:`最近对话`, Hindi:`हाल की चैट`, Japanese:`最近のチャット`,
  },

  noChatsYet: {
    English:`No chats yet. Start a conversation!`, Swahili:`Hakuna mazungumzo bado. Anza!`,
    French:`Pas encore de discussions. Commencez!`, Spanish:`Sin conversaciones aún. ¡Empieza!`,
    German:`Noch keine Gespräche. Starte jetzt!`, Portuguese:`Sem conversas ainda. Comece!`,
    Arabic:`لا توجد محادثات بعد. ابدأ!`, Chinese:`还没有对话，开始吧！`,
    Hindi:`अभी कोई चैट नहीं। शुरू करें!`, Japanese:`まだチャットがありません。始めましょう！`,
  },

  tools: {
    English:`Tools`, Swahili:`Zana`, French:`Outils`, Spanish:`Herramientas`,
    German:`Werkzeuge`, Portuguese:`Ferramentas`, Arabic:`أدوات`,
    Chinese:`工具`, Hindi:`उपकरण`, Japanese:`ツール`,
  },

  ugandaCurriculum: {
    English:`Uganda Curriculum`, Swahili:`Mtaala wa Uganda`, French:`Programme ougandais`,
    Spanish:`Currículo de Uganda`, German:`Uganda-Lehrplan`, Portuguese:`Currículo de Uganda`,
    Arabic:`المنهج الأوغندي`, Chinese:`乌干达课程`, Hindi:`युगांडा पाठ्यक्रम`, Japanese:`ウガンダカリキュラム`,
  },

  progressDashboard: {
    English:`Progress Dashboard`, Swahili:`Dashibodi ya Maendeleo`, French:`Tableau de bord`,
    Spanish:`Panel de progreso`, German:`Fortschritts-Dashboard`, Portuguese:`Painel de progresso`,
    Arabic:`لوحة التقدم`, Chinese:`进度仪表板`, Hindi:`प्रगति डैशबोर्ड`, Japanese:`進捗ダッシュボード`,
  },

  studyReminders: {
    English:`Study Reminders`, Swahili:`Ukumbusho wa Masomo`, French:`Rappels d'étude`,
    Spanish:`Recordatorios de estudio`, German:`Lernerinnerungen`, Portuguese:`Lembretes de estudo`,
    Arabic:`تذكيرات الدراسة`, Chinese:`学习提醒`, Hindi:`अध्ययन अनुस्मारक`, Japanese:`学習リマインダー`,
  },

  aiImages: {
    English:`AI Image Generator`, Swahili:`Jenereta ya Picha ya AI`, French:`Générateur d'images IA`,
    Spanish:`Generador de imágenes IA`, German:`KI-Bildgenerator`, Portuguese:`Gerador de imagens IA`,
    Arabic:`مولد صور الذكاء الاصطناعي`, Chinese:`AI图像生成器`, Hindi:`AI छवि जनरेटर`, Japanese:`AI画像生成`,
  },

  dailyAttempts: {
    English:`Daily quiz attempts`, Swahili:`Majaribio ya leo`, French:`Tentatives quotidiennes`,
    Spanish:`Intentos diarios`, German:`Tägliche Versuche`, Portuguese:`Tentativas diárias`,
    Arabic:`محاولات اليومية`, Chinese:`每日测试次数`, Hindi:`दैनिक प्रयास`, Japanese:`本日のクイズ回数`,
  },

  remainingToday: {
    English:`remaining today`, Swahili:`zilizobaki leo`, French:`restants aujourd'hui`,
    Spanish:`restantes hoy`, German:`heute verbleibend`, Portuguese:`restantes hoje`,
    Arabic:`المتبقية اليوم`, Chinese:`今日剩余`, Hindi:`आज शेष`, Japanese:`本日の残り`,
  },

  apiKeys: {
    English:`API Keys`, Swahili:`Funguo za API`, French:`Clés API`,
    Spanish:`Claves API`, German:`API-Schlüssel`, Portuguese:`Chaves de API`,
    Arabic:`مفاتيح API`, Chinese:`API密钥`, Hindi:`API कुंजियाँ`, Japanese:`APIキー`,
  },

  openaiKey: {
    English:`OpenAI API Key`, Swahili:`Ufunguo wa OpenAI API`, French:`Clé API OpenAI`,
    Spanish:`Clave API de OpenAI`, German:`OpenAI API-Schlüssel`, Portuguese:`Chave API OpenAI`,
    Arabic:`مفتاح OpenAI API`, Chinese:`OpenAI API密钥`, Hindi:`OpenAI API कुंजी`, Japanese:`OpenAI APIキー`,
  },

  saveKey: {
    English:`Save Key`, Swahili:`Hifadhi Ufunguo`, French:`Enregistrer la clé`,
    Spanish:`Guardar clave`, German:`Schlüssel speichern`, Portuguese:`Salvar chave`,
    Arabic:`حفظ المفتاح`, Chinese:`保存密钥`, Hindi:`कुंजी सहेजें`, Japanese:`キーを保存`,
  },

  saved: {
    English:`Saved!`, Swahili:`Imehifadhiwa!`, French:`Enregistré!`,
    Spanish:`Guardado!`, German:`Gespeichert!`, Portuguese:`Salvo!`,
    Arabic:`تم الحفظ!`, Chinese:`已保存！`, Hindi:`सहेजा गया!`, Japanese:`保存しました！`,
  },

  sessionOnly: {
    English:`Stored in memory for this session only.`,
    Swahili:`Imehifadhiwa kwa kikao hiki tu.`,
    French:`Stocké en mémoire pour cette session uniquement.`,
    Spanish:`Almacenado solo para esta sesión.`,
    German:`Nur für diese Sitzung gespeichert.`,
    Portuguese:`Armazenado apenas para esta sessão.`,
    Arabic:`مخزن في الذاكرة لهذه الجلسة فقط.`,
    Chinese:`仅在本次会话中存储。`,
    Hindi:`केवल इस सत्र के लिए संग्रहीत।`,
    Japanese:`このセッションのみメモリに保存。`,
  },

  language: {
    English:`Language`, Swahili:`Lugha`, French:`Langue`, Spanish:`Idioma`,
    German:`Sprache`, Portuguese:`Idioma`, Arabic:`اللغة`,
    Chinese:`语言`, Hindi:`भाषा`, Japanese:`言語`,
  },

  responseLanguage: {
    English:`Response Language`, Swahili:`Lugha ya Jibu`, French:`Langue de réponse`,
    Spanish:`Idioma de respuesta`, German:`Antwortsprache`, Portuguese:`Idioma de resposta`,
    Arabic:`لغة الرد`, Chinese:`回复语言`, Hindi:`उत्तर भाषा`, Japanese:`応答言語`,
  },

  settingsTitle: {
    English:`Settings`, Swahili:`Mipangilio`, French:`Paramètres`,
    Spanish:`Configuración`, German:`Einstellungen`, Portuguese:`Configurações`,
    Arabic:`الإعدادات`, Chinese:`设置`, Hindi:`सेटिंग्स`, Japanese:`設定`,
  },

  aiModel: {
    English:`AI Model`, Swahili:`Mfano wa AI`, French:`Modèle IA`,
    Spanish:`Modelo de IA`, German:`KI-Modell`, Portuguese:`Modelo de IA`,
    Arabic:`نموذج الذكاء الاصطناعي`, Chinese:`AI模型`, Hindi:`AI मॉडल`, Japanese:`AIモデル`,
  },

  temperature: {
    English:`Temperature (Creativity)`, Swahili:`Joto (Ubunifu)`, French:`Température (Créativité)`,
    Spanish:`Temperatura (Creatividad)`, German:`Temperatur (Kreativität)`, Portuguese:`Temperatura (Criatividade)`,
    Arabic:`الحرارة (الإبداع)`, Chinese:`温度（创造力）`, Hindi:`तापमान (रचनात्मकता)`, Japanese:`温度（創造性）`,
  },

  quizDifficulty: {
    English:`Quiz Difficulty`, Swahili:`Ugumu wa Maswali`, French:`Difficulté du quiz`,
    Spanish:`Dificultad del quiz`, German:`Quiz-Schwierigkeit`, Portuguese:`Dificuldade do quiz`,
    Arabic:`صعوبة الاختبار`, Chinese:`测验难度`, Hindi:`क्विज़ कठिनाई`, Japanese:`クイズの難易度`,
  },

  questionsPerQuiz: {
    English:`Questions per Quiz`, Swahili:`Maswali kwa Quiz`, French:`Questions par quiz`,
    Spanish:`Preguntas por quiz`, German:`Fragen pro Quiz`, Portuguese:`Perguntas por quiz`,
    Arabic:`أسئلة لكل اختبار`, Chinese:`每次测验题数`, Hindi:`प्रति क्विज़ प्रश्न`, Japanese:`クイズあたりの問題数`,
  },

  preferredName: {
    English:`Preferred Name`, Swahili:`Jina Unalolipenda`, French:`Nom préféré`,
    Spanish:`Nombre preferido`, German:`Bevorzugter Name`, Portuguese:`Nome preferido`,
    Arabic:`الاسم المفضل`, Chinese:`偏好名称`, Hindi:`पसंदीदा नाम`, Japanese:`好みの名前`,
  },

  aiWillCall: {
    English:`The AI will address you by this name.`,
    Swahili:`AI itakuita kwa jina hili.`,
    French:`L'IA s'adressera à vous par ce nom.`,
    Spanish:`La IA te llamará por este nombre.`,
    German:`Die KI wird dich mit diesem Namen ansprechen.`,
    Portuguese:`A IA vai te chamar por este nome.`,
    Arabic:`سيخاطبك الذكاء الاصطناعي بهذا الاسم.`,
    Chinese:`AI将用这个名字称呼您。`,
    Hindi:`AI इस नाम से संबोधित करेगा।`,
    Japanese:`AIはこの名前で呼びかけます。`,
  },

  modules: {
    English:`Modules`, Swahili:`Moduli`, French:`Modules`, Spanish:`Módulos`,
    German:`Module`, Portuguese:`Módulos`, Arabic:`الوحدات`,
    Chinese:`模块`, Hindi:`मॉड्यूल`, Japanese:`モジュール`,
  },

  quizMode: {
    English:`Quiz Mode`, Swahili:`Hali ya Maswali`, French:`Mode quiz`,
    Spanish:`Modo quiz`, German:`Quiz-Modus`, Portuguese:`Modo quiz`,
    Arabic:`وضع الاختبار`, Chinese:`测验模式`, Hindi:`क्विज़ मोड`, Japanese:`クイズモード`,
  },

  topicExplanations: {
    English:`Topic Explanations`, Swahili:`Maelezo ya Mada`, French:`Explications de sujets`,
    Spanish:`Explicaciones de temas`, German:`Themen-Erklärungen`, Portuguese:`Explicações de tópicos`,
    Arabic:`شرح المواضيع`, Chinese:`主题解释`, Hindi:`विषय स्पष्टीकरण`, Japanese:`トピックの説明`,
  },

  studyRecs: {
    English:`Study Recommendations`, Swahili:`Mapendekezo ya Masomo`, French:`Recommandations d'étude`,
    Spanish:`Recomendaciones de estudio`, German:`Lernempfehlungen`, Portuguese:`Recomendações de estudo`,
    Arabic:`توصيات الدراسة`, Chinese:`学习建议`, Hindi:`अध्ययन सिफारिशें`, Japanese:`学習推薦`,
  },

  progressTracking: {
    English:`Progress Tracking`, Swahili:`Kufuatilia Maendeleo`, French:`Suivi des progrès`,
    Spanish:`Seguimiento del progreso`, German:`Fortschrittsverfolgung`, Portuguese:`Acompanhamento do progresso`,
    Arabic:`تتبع التقدم`, Chinese:`进度追踪`, Hindi:`प्रगति ट्रैकिंग`, Japanese:`進捗追跡`,
  },

  socraticMode: {
    English:`Socratic Mode`, Swahili:`Hali ya Kisokrasi`, French:`Mode socratique`,
    Spanish:`Modo socrático`, German:`Sokratischer Modus`, Portuguese:`Modo socrático`,
    Arabic:`الوضع السقراطي`, Chinese:`苏格拉底模式`, Hindi:`सुकराती मोड`, Japanese:`ソクラテスモード`,
  },

  descInteractiveQuiz: {
    English:`Interactive quizzes`, Swahili:`Maswali ya maingiliano`, French:`Quiz interactifs`,
    Spanish:`Cuestionarios interactivos`, German:`Interaktive Tests`, Portuguese:`Questionários interativos`,
    Arabic:`اختبارات تفاعلية`, Chinese:`互动测验`, Hindi:`इंटरैक्टिव क्विज़`, Japanese:`インタラクティブクイズ`,
  },

  descWikipedia: {
    English:`Wikipedia-grounded answers`, Swahili:`Majibu ya Wikipedia`, French:`Réponses basées sur Wikipedia`,
    Spanish:`Respuestas basadas en Wikipedia`, German:`Wikipedia-basierte Antworten`, Portuguese:`Respostas baseadas na Wikipedia`,
    Arabic:`إجابات مستندة إلى ويكيبيديا`, Chinese:`基于维基百科的回答`, Hindi:`विकिपीडिया आधारित उत्तर`, Japanese:`Wikipedia基準の回答`,
  },

  descStudyPlans: {
    English:`Personalised study plans`, Swahili:`Mipango ya masomo ya kibinafsi`, French:`Plans d'étude personnalisés`,
    Spanish:`Planes de estudio personalizados`, German:`Personalisierte Lernpläne`, Portuguese:`Planos de estudo personalizados`,
    Arabic:`خطط دراسة مخصصة`, Chinese:`个性化学习计划`, Hindi:`व्यक्तिगत अध्ययन योजनाएं`, Japanese:`個別学習プラン`,
  },

  descTracking: {
    English:`Track topics and scores`, Swahili:`Fuatilia mada na alama`, French:`Suivre les sujets et scores`,
    Spanish:`Seguir temas y puntuaciones`, German:`Themen und Punkte verfolgen`, Portuguese:`Rastrear tópicos e pontuações`,
    Arabic:`تتبع المواضيع والدرجات`, Chinese:`追踪主题和分数`, Hindi:`विषय और स्कोर ट्रैक करें`, Japanese:`トピックとスコアを追跡`,
  },

  descSocratic: {
    English:`Guide with questions, not answers`, Swahili:`Ongoza kwa maswali, si majibu`, French:`Guider par des questions`,
    Spanish:`Guiar con preguntas, no respuestas`, German:`Mit Fragen führen, nicht Antworten`, Portuguese:`Guiar com perguntas, não respostas`,
    Arabic:`التوجيه بالأسئلة لا الإجابات`, Chinese:`用问题引导，而非答案`, Hindi:`प्रश्नों से मार्गदर्शन`, Japanese:`答えでなく質問で導く`,
  },

};

export function t(lang, key) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] || entry['English'] || key;
}

export const LANGUAGES = [
  'English', 'Swahili', 'French', 'Spanish', 'German',
  'Portuguese', 'Arabic', 'Chinese', 'Hindi', 'Japanese',
];

export default t;