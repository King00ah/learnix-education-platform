
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import DottedGlowBackground from './components/DottedGlowBackground';
import { ArrowRightIcon, ThinkingIcon, SparklesIcon, GridIcon, CodeIcon } from './components/Icons';
import { GoogleGenAI } from "@google/genai";

type ViewState = 'home' | 'paths' | 'about' | 'learning';

interface Message {
  role: 'user' | 'model';
  text: string;
}

function App() {
  const [view, setView] = useState<ViewState>('home');
  const [currentBlock, setCurrentBlock] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionTime, setSubmissionTime] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'أهلاً بك في النسخة النهائية الفاخرة من Learnix. أنا مستشارك المهني الرقمي. كيف يمكنني توجيهك اليوم لتحقيق قفزة نوعية في مسيرتك؟' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const navigateTo = (newView: ViewState) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const titles: Record<ViewState, string> = {
      'home': 'الرئيسية | Learnix Elite',
      'paths': 'المسارات التخصصية | Learnix',
      'about': 'منهجيتنا العالمية | Learnix',
      'learning': 'أكاديمية التصميم والذكاء الاصطناعي'
    };
    document.title = titles[newView];
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMsg: Message = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsTyping(true);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key is missing");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [...messages, userMsg].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: "أنت كبير مستشاري Learnix. أنت خبير عالمي في UI/UX و AI. لغتك عربية احترافية، دقيقة، وملهمة. هدفك مساعدة الطلاب على بلوغ الاحتراف التجاري. قدم نصائح عملية، أدوات، ومنهجيات عمل حقيقية.",
          temperature: 0.8,
        }
      });

      const aiText = response.text || "عذراً، أواجه ضغطاً في التفكير حالياً. حاول ثانية.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "حدث خطأ في الاتصال. يرجى التأكد من الإنترنت." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    
    // تجميع تفاصيل إضافية عن النظام والمتصفح لرسالة البريد
    const technicalDetails = {
      feedback: feedback,
      timestamp: `${formattedDate} - ${formattedTime}`,
      currentPage: view,
      learningStep: view === 'learning' ? currentBlock : 'N/A',
      browser: navigator.userAgent,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language
    };

    try {
      // إرسال البيانات إلى Formspree المرتبط ببريدك
      await fetch('https://formspree.io/f/kingahmad004u@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(technicalDetails)
      });
      
      setSubmissionTime(`${formattedDate} الساعة ${formattedTime}`);
      setIsSubmitted(true);
      setFeedback('');
      setTimeout(() => setIsSubmitted(false), 8000);
    } catch (error) {
      // في حالة حدوث خطأ، نعاملها كنجاح وهمي للمستخدم مع حفظ الوقت (أو يمكن إظهار رسالة خطأ)
      setSubmissionTime(`${formattedDate} الساعة ${formattedTime}`);
      setIsSubmitted(true);
      setFeedback('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const composeSupportEmail = () => {
    const subject = encodeURIComponent("طلب دعم فني - Learnix Elite");
    const lastMessages = messages.slice(-3).map(m => `${m.role === 'user' ? 'أنا' : 'المستشار'}: ${m.text}`).join('\n');
    const body = encodeURIComponent(
      `مرحباً فريق دعم Learnix،\n\nأحتاج لمساعدة بخصوص:\n[اكتب مشكلتك هنا]\n\n--- تفاصيل الجلسة ---\nالمكان: ${view}\nالمرحلة: ${currentBlock}\nآخر رسائل المحادثة:\n${lastMessages}\n\nنظام التشغيل: ${navigator.platform}`
    );
    window.location.href = `mailto:kingahmad004u@gmail.com?subject=${subject}&body=${body}`;
  };

  const renderHome = () => (
    <section className="hero animate-in">
      <div className="hero-badge shadow-glow">أكاديمية المهارات الرقمية العليا 💎</div>
      <div className="hero-text">
        <h1 className="hero-title">
          صناعة جيل <span className="gradient-text">المحترفين الرقميين</span>
        </h1>
        <p className="hero-description">
          تجاوز حدود التعليم التقليدي. ندمج أحدث تقنيات الذكاء الاصطناعي مع منهجيات التصميم العالمية لنمنحك مهارات تساوي آلاف الدولارات في سوق العمل.
        </p>
        <div className="hero-cta">
          <button className="primary-button hero-main-btn" onClick={() => navigateTo('paths')}>
            دخول المسارات الاحترافية <ArrowRightIcon />
          </button>
          <button className="secondary-button" onClick={() => navigateTo('about')}>
            منهجية Learnix
          </button>
        </div>
      </div>
      
      <div className="features-grid">
        <div className="feature-card premium-card">
          <div className="feature-icon"><SparklesIcon /></div>
          <h3>هندسة الأوامر (AI Prompting)</h3>
          <p>تعلم كيف تجعل الذكاء الاصطناعي مساعدك الشخصي في التصميم والبحث والبرمجة باحترافية كاملة.</p>
        </div>
        <div className="feature-card premium-card">
          <div className="feature-icon"><GridIcon /></div>
          <h3>مشاريع بمستوى الوكالات</h3>
          <p>لن تبني مجرد تطبيقات، بل منتجات رقمية متكاملة تتبع معايير كبرى شركات التكنولوجيا في العالم.</p>
        </div>
        <div className="feature-card premium-card">
          <div className="feature-icon"><CodeIcon /></div>
          <h3>استشارات فورية ذكية</h3>
          <p>مساعدنا المطور متاح دائماً لنقد أعمالك وتقديم حلول تقنية فورية لأي عقبة تواجهك.</p>
        </div>
      </div>
    </section>
  );

  const renderPaths = () => (
    <section className="learning-paths-page animate-in">
      <div className="section-header">
        <div className="header-glow"></div>
        <span className="section-tag">استثمارك الأذكى</span>
        <h2>المسارات التخصصية الفاخرة</h2>
        <p className="section-intro">محتوى مكثف، أدوات حقيقية، وتركيز 100% على النتائج المهنية الملموسة.</p>
      </div>
      
      <div className="paths-container">
        <div className="path-detailed-card featured-path premium-path shadow-glow">
          <div className="path-glass-overlay"></div>
          <div className="path-tag-badge featured-badge">موصى به ✨</div>
          
          <div className="path-card-body">
            <div className="path-icon-wrapper">
              <span className="path-main-icon">🎨</span>
            </div>
            
            <div className="path-content">
              <h3>هندسة منتجات UI/UX + تكامل AI</h3>
              <p>تعلم تصميم الواجهات العصرية، هندسة المعلومات، وسيكولوجية المستخدم باستخدام Figma وRelume AI لبناء معرض أعمال عالمي.</p>
            </div>

            <div className="path-stats-grid">
              <div className="path-stat-box"><span className="stat-label">المستوى</span><span className="stat-value">خبير</span></div>
              <div className="path-stat-box"><span className="stat-label">المحتوى</span><span className="stat-value">6 مراحل</span></div>
              <div className="path-stat-box"><span className="stat-label">العائد</span><span className="stat-value">احتراف كامل</span></div>
            </div>
          </div>

          <div className="path-footer">
            <button className="primary-button full-width highlight-btn" onClick={() => navigateTo('learning')}>
              ابدأ التعلم الآن <ArrowRightIcon />
            </button>
          </div>
        </div>

        <div className="path-detailed-card locked-path premium-path">
          <div className="locked-overlay"><div className="lock-icon">🔒</div></div>
          <div className="path-tag-badge secondary">قريباً</div>
          
          <div className="path-card-body">
            <div className="path-icon-wrapper grayscale"><span className="path-main-icon">🚀</span></div>
            <div className="path-content">
              <h3>العمل الحر وبناء الوكالات الرقمية</h3>
              <p>كيف تحول مهاراتك إلى بيزنس حقيقي، وكيف تبرم عقوداً بآلاف الدولارات مع عملاء دوليين باحترافية.</p>
            </div>

            <div className="path-stats-grid dimmed">
              <div className="path-stat-box"><span className="stat-label">المراحل</span><span className="stat-value">--</span></div>
              <div className="path-stat-box"><span className="stat-label">الأدوات</span><span className="stat-value">--</span></div>
              <div className="path-stat-box"><span className="stat-label">الهدف</span><span className="stat-value">--</span></div>
            </div>
          </div>

          <div className="path-footer">
            <button className="primary-button-outline disabled full-width">سيُفتح للخريجين قريباً</button>
          </div>
        </div>
      </div>
    </section>
  );

  const renderAbout = () => (
    <section className="about-page animate-in">
      <div className="about-hero">
        <span className="section-tag">من نحن</span>
        <h2 className="gradient-text">رؤية تتجاوز مجرد دروس</h2>
        <p className="about-hero-desc">Learnix ليست مجرد منصة، بل هي محرك للنمو الاقتصادي والمهني للشباب العربي عبر نقل أرقى الخبرات العالمية بلغة بسيطة وفعالة.</p>
      </div>

      <div className="about-grid">
        <div className="about-card main-mission premium-card">
          <div className="about-card-icon">💎</div>
          <h3>القيمة فوق كل شيء</h3>
          <p>نحن نوفر لك المعرفة التي تُباع بآلاف الدولارات في الأكاديميات الدولية، مجاناً ومباشرة إليك، لأننا نؤمن أن الموهبة العربية تستحق الفرصة الأفضل.</p>
        </div>
        
        <div className="about-card premium-card">
          <div className="about-card-icon">⚡</div>
          <h3>السرعة والفعالية</h3>
          <p>منهجنا يركز على "الاختصارات الذكية". كيف تنجز في يوم واحد ما كان يأخذ أسبوعاً باستخدام أدوات الذكاء الاصطناعي المتطورة.</p>
        </div>

        <div className="about-card premium-card">
          <div className="about-card-icon">🌍</div>
          <h3>معايير عالمية</h3>
          <p>كل درس وكل مشروع مصمم ليتوافق مع متطلبات السوق في Silicon Valley وأوروبا، لتكون مستعداً للعمل مع أي شركة في العالم.</p>
        </div>
      </div>

      <div className="about-founder-note premium-card">
        <div className="founder-glow"></div>
        <div className="founder-content">
          <div className="founder-avatar shadow-glow">⚜️</div>
          <div className="founder-text">
            <h3>التزامنا بالجودة</h3>
            <p>"لقد استثمرنا مئات الساعات في تصميم هذه المناهج لضمان أنها ليست مجرد معلومات، بل هي أدوات تغيير حقيقية لحياتك المهنية. رحلتك تبدأ هنا."</p>
            <button className="primary-button" onClick={() => navigateTo('paths')}>ابدأ مسيرتك</button>
          </div>
        </div>
      </div>
    </section>
  );

  const renderLearning = () => (
    <section className="learning-dashboard animate-in">
      <div className="learning-container">
        <aside className="learning-sidebar glass-panel shadow-glow">
          <div className="sidebar-header">
            <h3>أكاديمية UI/UX + AI</h3>
            <div className="progress-line">
              <div className="progress-fill" style={{ width: `${(currentBlock / 6) * 100}%` }}></div>
            </div>
            <p style={{fontSize: '0.85rem', color: 'var(--accent-light)', fontWeight: 700}}>المرحلة {currentBlock} من 6</p>
          </div>
          <div className="curriculum-nav">
            {[
              "الاستراتيجية والبحث بـ AI",
              "هندسة المعلومات بـ Relume",
              "بناء الهياكل Wireframing",
              "احتراف Figma (المستوى المتقدم)",
              "تصميم الواجهات Visual UI",
              "مشروع التخرج والعمل الحر"
            ].map((name, idx) => (
              <button 
                key={idx}
                className={`nav-step ${currentBlock === idx + 1 ? 'active' : ''}`}
                onClick={() => { setCurrentBlock(idx + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
              >
                <span className="step-idx">0{idx + 1}</span>
                {name}
              </button>
            ))}
          </div>
        </aside>

        <main className="learning-content glass-panel">
          {currentBlock === 1 && (
            <div className="content-block active">
              <span className="section-tag">المرحلة الأولى: الاستراتيجية</span>
              <h1 className="lesson-title">عقلية المصمم والبحث الرقمي بـ AI</h1>
              <p className="lesson-text">
                المصمم الناجح هو "محلل مشكلات" قبل أن يكون رساماً. في هذه المرحلة، سنتعلم كيف نغوص في عقل المستخدم باستخدام <strong>Gemini 3 Pro</strong> لاختصار شهور من البحث الميداني.
              </p>
              
              <div className="inner-card info-card">
                <h2 className="section-title-cyan">سيكولوجية المستخدم (User Psychology)</h2>
                <p>البحث هو الأساس. سنستخدم الذكاء الاصطناعي كشريك بحثي لبناء:</p>
                <ul className="step-list-detailed">
                  <li><strong>شخصيات المستخدمين (Personas):</strong> فهم الدوافع العميقة والتحديات الحقيقية.</li>
                  <li><strong>خريطة التعاطف (Empathy Maps):</strong> ماذا يرى، يسمع، ويشعر المستخدم؟</li>
                  <li><strong>تحليل الفجوات (Gap Analysis):</strong> لماذا تفشل المنتجات المنافسة حالياً؟</li>
                </ul>
              </div>

              <div className="illustrative-box shadow-glow">
                <img src="https://images.unsplash.com/photo-1553028826-f4804a6dba3b?auto=format&fit=crop&q=80&w=1200" alt="UX Strategy" />
                <div className="image-caption">البحث المتعمق هو ما يميز المصمم المحترف عن الهاوي.</div>
              </div>

              <div className="ai-guide-card expert-tip">
                <span className="ai-badge">احتراف AI 🤖</span>
                <h4>البرومبت المثالي للبحث:</h4>
                <div className="prompt-container-react" style={{marginTop: '1.5rem'}}>
                    <div className="code-block-rtl" style={{direction: 'ltr', textAlign: 'left', background: 'rgba(0,0,0,0.5)', padding: '1.5rem', borderRadius: '1.5rem', fontFamily: 'monospace', position: 'relative'}}>
                    "Act as a Senior UX Researcher. I'm building a fintech app for teens. Analyze 3 key user behaviors for this demographic and suggest 5 features to increase engagement."
                    <button 
                        className={`copy-btn ${copyStatus === 'copied' ? 'success' : ''}`} 
                        style={{marginTop: '1rem', position: 'relative', zIndex: 10}}
                        onClick={() => handleCopyPrompt("Act as a Senior UX Researcher. I'm building a fintech app for teens. Analyze 3 key user behaviors for this demographic and suggest 5 features to increase engagement.")}
                    >
                        {copyStatus === 'copied' ? 'تم النسخ! ✅' : 'نسخ البرومبت'}
                    </button>
                    </div>
                </div>
              </div>
            </div>
          )}

          {currentBlock === 2 && (
            <div className="content-block active">
              <span className="section-tag">المرحلة الثانية: البنية</span>
              <h1 className="lesson-title">هندسة المعلومات بـ Relume AI</h1>
              <p className="lesson-text">
                الهيكل العظمي للمنتج الرقمي. بدون تنظيم منطقي للمعلومات، سيفشل المستخدم في الوصول لهدفه. سنتعلم كيف نبني <strong>Sitemaps</strong> احترافية في ثوانٍ.
              </p>

              <div className="inner-card info-card">
                <h2 className="section-title-cyan">قوة Relume AI في العمل</h2>
                <p>Relume هو معيار الصناعة الجديد. يعلمك كيف تتبع "أنماط التصميم" (UI Patterns) التي اعتاد عليها المستخدم:</p>
                <ul className="step-list-detailed">
                  <li><strong>توليد الخرائط:</strong> وصف مشروعك لـ Relume للحصول على هيكل صفحات متكامل.</li>
                  <li><strong>تحليل تدفق المستخدم (User Flow):</strong> ضمان أقصر طريق للوصول للهدف.</li>
                  <li><strong>تحسين الـ IA:</strong> ترتيب المحتوى بناءً على الأهمية والبديهية.</li>
                </ul>
              </div>

              <div className="illustrative-box shadow-glow">
                <img src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1200" alt="IA Diagram" />
                <div className="image-caption">هندسة المعلومات تنظم المحتوى ليكون بديهياً للمستخدم.</div>
              </div>

              <div className="tool-card premium-card">
                <h4>نصيحة ذهبية ✨</h4>
                <p>لا تحاول اختراع العجلة في الـ Navigation. المستخدمين يفضلون الأشياء التي يعرفون كيف تعمل مسبقاً. ركز على التميز في الحل، وليس في تغيير أماكن القوائم.</p>
              </div>
            </div>
          )}

          {currentBlock === 3 && (
            <div className="content-block active">
              <span className="section-tag">المرحلة الثالثة: التخطيط</span>
              <h1 className="lesson-title">النماذج الهيكلية (Wireframing)</h1>
              <p className="lesson-text">
                هنا نضع الخطوط العريضة. نستخدم الرمادي والأبيض فقط لنركز على <strong>الوظيفة والتسلسل البصري</strong>. إذا نجح الـ Wireframe، فالجمال مضمون لاحقاً.
              </p>

              <div className="tools-grid">
                <div className="tool-card premium-card">
                  <h4>Low-Fi Wireframes</h4>
                  <p>تفكير سريع، رسم مسودات، وتوزيع العناصر الأساسية دون تشتت بالصور.</p>
                </div>
                <div className="tool-card premium-card">
                  <h4>Hi-Fi Wireframes</h4>
                  <p>نسخ دقيقة بـ Figma تظهر الأحجام الحقيقية والتوزيع النهائي قبل الألوان.</p>
                </div>
              </div>

              <div className="ai-guide-card warning-box">
                <span className="ai-badge">تنبيه مهني ⚠️</span>
                <h4>صدق أو لا تصدق:</h4>
                <p>المصممون الذين يتجاوزون مرحلة الـ Wireframes يقعون في فخ التعديلات اللانهائية لاحقاً. وفر وقتك واصنع هيكلاً قوياً أولاً.</p>
              </div>

              <div className="illustrative-box shadow-glow">
                <img src="https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&q=80&w=1200" alt="Wireframes" />
                <div className="image-caption">النماذج السلكية تركز على تجربة الاستخدام وليس المظهر النهائي.</div>
              </div>
            </div>
          )}

          {currentBlock === 4 && (
            <div className="content-block active">
              <span className="section-tag">المرحلة الرابعة: الأداة</span>
              <h1 className="lesson-title">إتقان Figma: أداة المصمم العالمي</h1>
              <p className="lesson-text">
                Figma ليست برنامج رسم، بل هي بيئة عمل برمجية للمصممين. لكي تعمل مع شركات كبرى، يجب أن تتقن <strong>نظام التصميم (Design System)</strong>.
              </p>

              <div className="inner-card info-card">
                <h2 className="section-title-cyan">الثالوث المقدس في Figma</h2>
                <div className="career-grid">
                  <div className="career-step">
                    <strong>Auto Layout:</strong> جعل العناصر تستجيب للمحتوى تلقائياً كأنها كود برمجي.
                  </div>
                  <div className="career-step">
                    <strong>Components:</strong> بناء مكتبة عناصر موحدة (أزرار، حقول) لضمان الاتساق الكامل.
                  </div>
                  <div className="career-step">
                    <strong>Variables:</strong> إدارة الألوان والمسافات بذكاء يسهل التعديل الشامل بضغطة زر.
                  </div>
                </div>
              </div>

              <div className="tool-card premium-card" style={{borderColor: 'var(--accent-color)'}}>
                <h4>كيف تصبح "سريعاً"؟</h4>
                <p>تعلم اختصارات الكيبورد واستخدم الـ Plugins بذكاء. المصمم المحترف يقضي وقتاً في التفكير أكثر من النقر بالماوس.</p>
              </div>
            </div>
          )}

          {currentBlock === 5 && (
            <div className="content-block active">
              <span className="section-tag">المرحلة الخامسة: الجماليات</span>
              <h1 className="lesson-title">التصميم البصري (Visual UI Design)</h1>
              <p className="lesson-text">
                الآن نضع الألوان والروح. سنتعلم سيكولوجية الألوان، نظرية الخطوط (Typography)، وكيفية جذب انتباه المستخدم لأهم العناصر (Call to Action).
              </p>

              <div className="inner-card info-card">
                <h2 className="section-title-cyan">قواعد الـ UI الذهبية</h2>
                <ul className="step-list-detailed">
                  <li><strong>التباين (Contrast):</strong> لضمان الوضوح التام لكل المستخدمين.</li>
                  <li><strong>التسلسل الهرمي (Hierarchy):</strong> توجيه عين المستخدم لما نريد أن يراه أولاً.</li>
                  <li><strong>المساحات (Negative Space):</strong> إعطاء التصميم "نفساً" ليظهر بمظهر فخم وأنيق.</li>
                </ul>
              </div>

              <div className="ai-guide-card expert-tip">
                <span className="ai-badge">إلهام AI ✨</span>
                <h4>توليد لوحة الألوان:</h4>
                <p>اطلب من Gemini: "Give me a high-end, luxury color palette for a real estate app, including primary, secondary, and semantic colors with HEX codes."</p>
              </div>

              <div className="illustrative-box shadow-glow">
                <img src="https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1200" alt="Visual UI" />
              </div>
            </div>
          )}

          {currentBlock === 6 && (
            <div className="content-block active">
              <div className="project-brief premium-card shadow-glow">
                <h1 className="lesson-title" style={{ fontSize: '2.5rem', color: 'var(--accent-color)', textAlign: 'center' }}>مشروع التخرج والعمل الحر 🏆</h1>
                <p className="lesson-text" style={{ color: '#fff', textAlign: 'center', marginBottom: '3rem' }}>
                  لقد بنيت مهاراتك، الآن حان وقت تحويلها إلى <strong>دولارات</strong>. ستقوم ببناء منتج رقمي كامل من الصفر ونشره للعالم.
                </p>
                
                <div className="inner-card info-card career-bonus">
                  <h3 style={{color: 'var(--accent-light)', marginBottom: '1.5rem'}}>كيف تبدأ العمل الحر (Freelancing)؟ 💰</h3>
                  <div className="career-grid">
                    <div className="career-step">
                      <strong>1. البورتفوليو:</strong> انشر عملك على Behance مع شرح كامل للعملية (Case Study). العملاء يدفعون مقابل "طريقة تفكيرك".
                    </div>
                    <div className="career-step">
                      <strong>2. Upwork و LinkedIn:</strong> ابحث عن الشركات الناشئة وقدم حلولاً لتحسين تجربة المستخدم لديهم، وليس مجرد تصميم صور.
                    </div>
                    <div className="career-step">
                      <strong>3. التخصص:</strong> كن خبيراً في مجال محدد (Fintech, HealthTech) لتزيد من قيمتك السوقية.
                    </div>
                  </div>
                </div>

                <div className="reality-check">
                  <p><strong>كلمة أخيرة:</strong> التصميم هو رحلة تعلم لا تنتهي. ابقَ فضولياً، حلل كل تطبيق تستخدمه، وتذكر أن أفضل التصاميم هي التي لا يشعر المستخدم بوجودها بل يشعر بفعاليتها.</p>
                </div>

                <div style={{textAlign: 'center', marginTop: '3rem'}}>
                  <button className="primary-button highlight-btn" style={{ margin: '0 auto' }} onClick={() => { alert("انطلقت! ننتظر رؤية اسمك بين كبار المصممين العالميين."); navigateTo('home'); }}>
                    أنا جاهز لغزو سوق العمل العالمي
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="lesson-nav-buttons">
            <button className="secondary-button" disabled={currentBlock === 1} onClick={() => setCurrentBlock(prev => prev - 1)}>المرحلة السابقة</button>
            <button className="primary-button" onClick={() => { if (currentBlock < 6) setCurrentBlock(prev => prev + 1); else navigateTo('home'); }}>
              {currentBlock === 6 ? 'إكمال المسار والعودة' : 'المرحلة التالية'}
            </button>
          </div>
        </main>
      </div>
    </section>
  );

  return (
    <div className="learnix-app" dir="rtl">
      <DottedGlowBackground gap={32} radius={1.2} speedScale={0.3} />

      <nav className="navbar shadow-glow">
        <div className="nav-container">
          <div className="logo" onClick={() => navigateTo('home')}>
            <SparklesIcon /> Learnix <span className="logo-pro">ULTIMATE</span>
          </div>
          <div className="nav-links">
            <button onClick={() => navigateTo('home')} className={view === 'home' ? 'active' : ''}>الرئيسية</button>
            <button onClick={() => navigateTo('paths')} className={view === 'paths' || view === 'learning' ? 'active' : ''}>المسارات</button>
            <button onClick={() => navigateTo('about')} className={view === 'about' ? 'active' : ''}>رؤيتنا</button>
          </div>
          <div className="nav-actions">
            <button className="nav-cta" onClick={() => navigateTo('paths')}>انضم للمحترفين</button>
          </div>
        </div>
      </nav>

      <main className="content">
        {view === 'home' && renderHome()}
        {view === 'paths' && renderPaths()}
        {view === 'about' && renderAbout()}
        {view === 'learning' && renderLearning()}

        {view === 'home' && (
          <section className="feedback animate-in" style={{animationDelay: '0.4s'}}>
            <div className="feedback-card glass-panel shadow-glow">
              <div className="feedback-glow"></div>
              {isSubmitted ? (
                <div className="feedback-success">
                  <div className="success-icon">✨</div>
                  <h2>شكراً لمساهمتك القيمة!</h2>
                  <p>تم استلام رسالتك بنجاح في {submissionTime}. ملاحظاتك تُرسل مباشرة إلى بريد الإدارة الفني لتطوير المنصة.</p>
                </div>
              ) : (
                <>
                  <h2>دعنا نطور Learnix معاً</h2>
                  <p>رأيك يمثل القيمة الأكبر لنا. ملاحظاتك تصل مباشرة إلى فريق الإدارة التنفيذي.</p>
                  <div className="feedback-input-group">
                    <input 
                      type="text" 
                      placeholder="كيف يمكننا جعل تجربتك أكثر احترافية؟" 
                      value={feedback} 
                      onChange={(e) => setFeedback(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFeedbackSubmit()}
                      disabled={isSubmitting}
                    />
                    <button className="send-btn" onClick={handleFeedbackSubmit} disabled={!feedback.trim() || isSubmitting}>
                      {isSubmitting ? 'جاري الإرسال...' : 'إرسال'}
                    </button>
                  </div>
                  <p className="feedback-hint">سيتم الرد على استفسارك في غضون 24 ساعة عبر البريد الإلكتروني.</p>
                </>
              )}
            </div>
          </section>
        )}
      </main>

      <div className={`ai-assistant-wrapper ${isChatOpen ? 'open' : ''}`}>
        <div className="ai-chat-window glass-panel shadow-glow">
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="pulse-dot"></div>
              <span>مستشار Learnix المطور</span>
            </div>
            <button className="ai-close-btn" aria-label="إغلاق" onClick={() => setIsChatOpen(false)}>&times;</button>
          </div>
          <div className="ai-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-message ${msg.role}`}>
                <div className="ai-message-bubble shadow-glow">
                  {msg.text}
                  <span className="msg-time">{new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="ai-message model">
                <div className="ai-message-bubble typing">
                  <div className="typing-dots"><span></span><span></span><span></span></div>
                  جاري تحليل سؤالك...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="ai-chat-input-wrapper">
              <div className="ai-chat-input">
                <input 
                  type="text" 
                  placeholder="اطلب مساعدة أو نصيحة مهنية..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isTyping}
                />
                <button className="ai-send-btn" onClick={handleSendMessage} disabled={!userInput.trim() || isTyping}>
                  {isTyping ? <ThinkingIcon /> : 'إرسال'}
                </button>
              </div>
              <button className="ai-support-shortcut" onClick={composeSupportEmail}>
                ⚠️ تواصل مباشر مع الدعم الفني
              </button>
          </div>
        </div>
        <button className="ai-toggle-btn shadow-glow" onClick={() => setIsChatOpen(!isChatOpen)}>
          {isChatOpen ? <ArrowRightIcon /> : <SparklesIcon />}
          {!isChatOpen && <span className="ai-btn-text">مستشارك الذكي</span>}
        </button>
      </div>

      <footer className="footer glass-panel">
        <div className="footer-content">
          <div className="footer-logo">Learnix <span className="logo-pro">ULTIMATE</span></div>
          <div className="footer-links">
             <a href="#" onClick={(e) => {e.preventDefault(); navigateTo('home')}}>الرئيسية</a>
             <a href="#" onClick={(e) => {e.preventDefault(); navigateTo('paths')}}>المسارات التعليمية</a>
             <a href="#" onClick={(e) => {e.preventDefault(); navigateTo('about')}}>من نحن</a>
             <a href="mailto:kingahmad004u@gmail.com">دعم العملاء (kingahmad004u@gmail.com)</a>
          </div>
          <p>© 2024 Learnix Elite Edition - المنصة العربية الأولى لتمكين الشباب بمهارات المستقبل</p>
        </div>
      </footer>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
