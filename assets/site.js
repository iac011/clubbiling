/* No credentials or Facebook SDK are needed for the public Page Plugin. */
let currentLanguage = 'fr';
function switchLang(lang) {
  if (!['fr', 'zh', 'en'].includes(lang)) return;
  currentLanguage = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-fr, .lang-zh, .lang-en').forEach(el => {
    // Reset display to the element's native inline/block behavior.
    el.style.display = el.classList.contains('lang-' + lang) ? 'revert' : 'none';
  });
  document.querySelectorAll('[data-language]').forEach(button => {
    const active = button.dataset.language === lang;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}
document.querySelectorAll('[data-language]').forEach(button => {
  button.addEventListener('click', () => switchLang(button.dataset.language));
});
switchLang('fr');

const feed = document.getElementById('unesco-feed');
const load = document.getElementById('load-unesco');
const stop = document.getElementById('stop-unesco');
const placeholder = feed.firstElementChild;
load.addEventListener('click', () => {
  // Meta supports widths from 180 to 500 pixels. Measure the actual column.
  const width = Math.max(180, Math.min(500, Math.floor(feed.clientWidth)));
  const parameters = new URLSearchParams({
    href: 'https://www.facebook.com/unesco', tabs: 'timeline',
    width: String(width), height: '500', small_header: 'true',
    adapt_container_width: 'true', hide_cover: 'false', show_facepile: 'false'
  });
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.facebook.com/plugins/page.php?' + parameters;
  iframe.title = 'UNESCO — Facebook';
  iframe.width = String(width);
  iframe.height = '500';
  iframe.referrerPolicy = 'no-referrer';
  // An iframe load event does not prove Facebook rendered the timeline.
  feed.replaceChildren(iframe);
  feed.classList.add('has-feed');
  load.hidden = true;
  load.setAttribute('aria-expanded', 'true');
  stop.hidden = false;
  stop.focus();
});
// Recreate the plugin URL only when its measured width changes.
let resizeTimer;
new ResizeObserver(() => {
 clearTimeout(resizeTimer);
 resizeTimer = setTimeout(() => {
  const iframe = feed.querySelector('iframe');
  if (!iframe) return;
  const width = Math.max(180, Math.min(500, Math.floor(feed.clientWidth)));
  if (Number(iframe.width) === width) return;
  const url = new URL(iframe.src);
  url.searchParams.set('width', String(width));
  iframe.width = String(width);
  iframe.src = url.toString();
 }, 150);
}).observe(feed);
stop.addEventListener('click', () => {
  feed.replaceChildren(placeholder);
  feed.classList.remove('has-feed');
  load.hidden = false;
  load.setAttribute('aria-expanded', 'false');
  stop.hidden = true;
  load.focus();
});

const assistant = document.getElementById('aiWindow');
const assistantToggle = document.getElementById('assistant-toggle');
function toggleAI(open) {
  const visible = typeof open === 'boolean' ? open : assistant.style.display !== 'flex';
  assistant.style.display = visible ? 'flex' : 'none';
  assistantToggle.setAttribute('aria-expanded', String(visible));
  (visible ? document.getElementById('aiInput') : assistantToggle).focus();
}
assistantToggle.addEventListener('click', () => toggleAI());
document.getElementById('assistant-close').addEventListener('click', () => toggleAI(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && assistant.style.display === 'flex') toggleAI(false);
});
const answers = {
 fr: {unknown: 'Je ne dispose pas encore de cette information. Contactez-nous à clubbilingueps@gmail.com ou remplissez le formulaire d’inscription.', classes: 'Nous proposons le chinois, l’anglais, le français et les mathématiques pour adultes et enfants, des sciences expérimentales pour collégiens et lycéens, ainsi que la calligraphie.', location: 'Les activités se déroulent à Paris et à Vitry-sur-Seine. Contactez le club pour confirmer le lieu exact de votre cours.', register: 'Pour une inscription ou une demande d’information, utilisez le formulaire de la page ou écrivez à clubbilingueps@gmail.com.'},
 zh: {unknown: '目前没有这项信息。请发送邮件至 clubbilingueps@gmail.com，或填写报名咨询表。', classes: '我们为成人及各年龄段孩子提供中文、英语、法语和数学课，为初高中学生提供科学实践课，并保留书法课程。', location: '活动在巴黎与塞纳河畔维特里开展。具体上课地点请联系俱乐部确认。', register: '报名或咨询请填写网页上的表格，或发送邮件至 clubbilingueps@gmail.com。'},
 en: {unknown: 'I do not have this information yet. Contact clubbilingueps@gmail.com or complete the registration enquiry form.', classes: 'We offer Chinese, English, French and mathematics for adults and children, practical science for secondary school students, and calligraphy.', location: 'Activities take place in Paris and Vitry-sur-Seine. Contact the club to confirm the exact venue for your class.', register: 'To register or ask a question, complete the form on this page or email clubbilingueps@gmail.com.'}
};
function appendMessage(text, className) {
 const message = document.createElement('div');
 message.className = className;
 message.textContent = text;
 const body = document.getElementById('aiBody');
 body.append(message);
 body.scrollTop = body.scrollHeight;
}
function sendMsg() {
 const input = document.getElementById('aiInput');
 const text = input.value.trim().slice(0, 1000);
 if (!text) return;
 appendMessage(text, 'user-msg');
 input.value = '';
 let topic = 'unknown';
 // Unknown schedules, fees, ages and availability always fall back to contact.
 if (/prix|tarif|horaire|heure|âge|age|places|disponib|gratuit|trial|free|schedule|time|fee|cost|price|费用|学费|价格|时间|几点|多少钱|收费|年龄|几岁|名额|免费|试听/i.test(text)) topic = 'unknown';
 else if (/inscri|register|enrol|contact|email|报名|联系|邮箱/i.test(text)) topic = 'register';
 else if (/lieu|adresse|où|where|location|address|地点|地址|哪里/i.test(text)) topic = 'location';
 else if (/cours|chinois|calligraph|class|chinese|课程|中文|英语|法语|数学|科学|书法/i.test(text)) topic = 'classes';
 appendMessage(answers[currentLanguage][topic], 'ai-msg');
}
document.getElementById('assistant-send').addEventListener('click', sendMsg);
document.getElementById('aiInput').addEventListener('keydown', event => {
 if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); sendMsg(); }
});
