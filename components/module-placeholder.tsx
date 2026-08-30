import AppShell from "./app-shell";

export default function ModulePlaceholder({title,eyebrow,description}:{title:string;eyebrow:string;description:string}){
 return <AppShell><section className="hero"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div></section><div className="empty card"><div className="empty-icon">U</div><h2>هذه الوحدة هي المكان المخصص لها</h2><p>الهيكلة أصبحت مستقلة. سيتم ربط تفاصيل الوحدة ببياناتها وخدماتها الخاصة دون التأثير على الوحدات الأخرى.</p></div></AppShell>
}
