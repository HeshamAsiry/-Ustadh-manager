"use client";

import { useEffect } from "react";
import { countryFlag } from "../lib/country";
import { COUNTRY_CODES } from "../lib/countries";

const currencies=[
  ["EUR","اليورو"],["USD","الدولار الأمريكي"],["GBP","الجنيه الإسترليني"],["CHF","الفرنك السويسري"],["CAD","الدولار الكندي"],["AUD","الدولار الأسترالي"],["AED","الدرهم الإماراتي"],["SAR","الريال السعودي"],["QAR","الريال القطري"],["KWD","الدينار الكويتي"],["EGP","الجنيه المصري"],["MAD","الدرهم المغربي"],["TRY","الليرة التركية"],["BHD","الدينار البحريني"],["OMR","الريال العُماني"],["JOD","الدينار الأردني"]
] as const;

/* Representative IANA timezone for each country in the picker.
   Countries with several time zones use the capital/main population zone. */
const COUNTRY_TIMEZONES:Record<string,string>={
AF:"Asia/Kabul",AL:"Europe/Tirane",DZ:"Africa/Algiers",AD:"Europe/Andorra",AO:"Africa/Luanda",AG:"America/Antigua",AR:"America/Argentina/Buenos_Aires",AM:"Asia/Yerevan",AU:"Australia/Sydney",AT:"Europe/Vienna",AZ:"Asia/Baku",BS:"America/Nassau",BH:"Asia/Bahrain",BD:"Asia/Dhaka",BB:"America/Barbados",BY:"Europe/Minsk",BE:"Europe/Brussels",BZ:"America/Belize",BJ:"Africa/Porto-Novo",BT:"Asia/Thimphu",BO:"America/La_Paz",BA:"Europe/Sarajevo",BW:"Africa/Gaborone",BR:"America/Sao_Paulo",BN:"Asia/Brunei",BG:"Europe/Sofia",BF:"Africa/Ouagadougou",BI:"Africa/Bujumbura",CV:"Atlantic/Cape_Verde",KH:"Asia/Phnom_Penh",CM:"Africa/Douala",CA:"America/Toronto",CF:"Africa/Bangui",TD:"Africa/Ndjamena",CL:"America/Santiago",CN:"Asia/Shanghai",CO:"America/Bogota",KM:"Indian/Comoro",CG:"Africa/Brazzaville",CD:"Africa/Kinshasa",CR:"America/Costa_Rica",CI:"Africa/Abidjan",HR:"Europe/Zagreb",CU:"America/Havana",CY:"Asia/Nicosia",CZ:"Europe/Prague",DK:"Europe/Copenhagen",DJ:"Africa/Djibouti",DM:"America/Dominica",DO:"America/Santo_Domingo",EC:"America/Guayaquil",EG:"Africa/Cairo",SV:"America/El_Salvador",GQ:"Africa/Malabo",ER:"Africa/Asmara",EE:"Europe/Tallinn",SZ:"Africa/Mbabane",ET:"Africa/Addis_Ababa",FJ:"Pacific/Fiji",FI:"Europe/Helsinki",FR:"Europe/Paris",GA:"Africa/Libreville",GM:"Africa/Banjul",GE:"Asia/Tbilisi",DE:"Europe/Berlin",GH:"Africa/Accra",GR:"Europe/Athens",GD:"America/Grenada",GT:"America/Guatemala",GN:"Africa/Conakry",GW:"Africa/Bissau",GY:"America/Guyana",HT:"America/Port-au-Prince",HN:"America/Tegucigalpa",HU:"Europe/Budapest",IS:"Atlantic/Reykjavik",IN:"Asia/Kolkata",ID:"Asia/Jakarta",IR:"Asia/Tehran",IQ:"Asia/Baghdad",IE:"Europe/Dublin",IT:"Europe/Rome",JM:"America/Jamaica",JP:"Asia/Tokyo",JO:"Asia/Amman",KZ:"Asia/Almaty",KE:"Africa/Nairobi",KI:"Pacific/Tarawa",KP:"Asia/Pyongyang",KR:"Asia/Seoul",KW:"Asia/Kuwait",KG:"Asia/Bishkek",LA:"Asia/Vientiane",LV:"Europe/Riga",LB:"Asia/Beirut",LS:"Africa/Maseru",LR:"Africa/Monrovia",LY:"Africa/Tripoli",LI:"Europe/Vaduz",LT:"Europe/Vilnius",LU:"Europe/Luxembourg",MG:"Indian/Antananarivo",MW:"Africa/Blantyre",MY:"Asia/Kuala_Lumpur",MV:"Indian/Maldives",ML:"Africa/Bamako",MT:"Europe/Malta",MH:"Pacific/Majuro",MR:"Africa/Nouakchott",MU:"Indian/Mauritius",MX:"America/Mexico_City",FM:"Pacific/Pohnpei",MD:"Europe/Chisinau",MC:"Europe/Monaco",MN:"Asia/Ulaanbaatar",ME:"Europe/Podgorica",MA:"Africa/Casablanca",MZ:"Africa/Maputo",MM:"Asia/Yangon",NA:"Africa/Windhoek",NR:"Pacific/Nauru",NP:"Asia/Kathmandu",NL:"Europe/Amsterdam",NZ:"Pacific/Auckland",NI:"America/Managua",NE:"Africa/Niamey",NG:"Africa/Lagos",MK:"Europe/Skopje",NO:"Europe/Oslo",OM:"Asia/Muscat",PK:"Asia/Karachi",PW:"Pacific/Palau",PA:"America/Panama",PG:"Pacific/Port_Moresby",PY:"America/Asuncion",PE:"America/Lima",PH:"Asia/Manila",PL:"Europe/Warsaw",PT:"Europe/Lisbon",QA:"Asia/Qatar",RO:"Europe/Bucharest",RU:"Europe/Moscow",RW:"Africa/Kigali",KN:"America/St_Kitts",LC:"America/St_Lucia",VC:"America/St_Vincent",WS:"Pacific/Apia",SM:"Europe/San_Marino",ST:"Africa/Sao_Tome",SA:"Asia/Riyadh",SN:"Africa/Dakar",RS:"Europe/Belgrade",SC:"Indian/Mahe",SL:"Africa/Freetown",SG:"Asia/Singapore",SK:"Europe/Bratislava",SI:"Europe/Ljubljana",SB:"Pacific/Guadalcanal",SO:"Africa/Mogadishu",ZA:"Africa/Johannesburg",SS:"Africa/Juba",ES:"Europe/Madrid",LK:"Asia/Colombo",SD:"Africa/Khartoum",SR:"America/Paramaribo",SE:"Europe/Stockholm",CH:"Europe/Zurich",SY:"Asia/Damascus",TJ:"Asia/Dushanbe",TZ:"Africa/Dar_es_Salaam",TH:"Asia/Bangkok",TL:"Asia/Dili",TG:"Africa/Lome",TO:"Pacific/Tongatapu",TT:"America/Port_of_Spain",TN:"Africa/Tunis",TR:"Europe/Istanbul",TM:"Asia/Ashgabat",TV:"Pacific/Funafuti",UG:"Africa/Kampala",UA:"Europe/Kyiv",AE:"Asia/Dubai",GB:"Europe/London",US:"America/New_York",UY:"America/Montevideo",UZ:"Asia/Tashkent",VU:"Pacific/Efate",VE:"America/Caracas",VN:"Asia/Ho_Chi_Minh",YE:"Asia/Aden",ZM:"Africa/Lusaka",ZW:"Africa/Harare",PS:"Asia/Gaza",VA:"Europe/Vatican"
};

type CountryItem={code:string;arabic:string;english:string;flag:string;timezone:string};

function setReactValue(el:HTMLInputElement|HTMLSelectElement,value:string){
  const proto=el instanceof HTMLInputElement?HTMLInputElement.prototype:HTMLSelectElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;
  setter?.call(el,value);
  el.dispatchEvent(new Event("input",{bubbles:true}));
  el.dispatchEvent(new Event("change",{bubbles:true}));
}

export default function StudentFormEnhancer(){
 useEffect(()=>{
  const arabicNames=new Intl.DisplayNames(["ar"],{type:"region"});
  const englishNames=new Intl.DisplayNames(["en"],{type:"region"});
  const countries:CountryItem[]=COUNTRY_CODES.map(code=>({
    code,
    arabic:arabicNames.of(code)||code,
    english:englishNames.of(code)||code,
    flag:countryFlag(code),
    timezone:COUNTRY_TIMEZONES[code]||"Etc/UTC"
  }));

  const enhance=()=>{
   document.querySelectorAll<HTMLFormElement>(".student-ref-modal").forEach(form=>{
    const grid=form.querySelector<HTMLElement>(".student-ref-form");
    if(!grid)return;
    const labels=[...grid.querySelectorAll<HTMLLabelElement>("label")];
    const countryLabel=labels.find(l=>l.childNodes[0]?.textContent?.trim()==="الدولة");
    const timezoneLabel=labels.find(l=>l.childNodes[0]?.textContent?.trim()==="المنطقة الزمنية");
    const timezoneInput=timezoneLabel?.querySelector<HTMLInputElement>("input");

    if(timezoneLabel&&timezoneInput&&!timezoneLabel.querySelector(".rq-timezone-note")){
      timezoneInput.readOnly=true;
      timezoneInput.title="يتم تحديد المنطقة الزمنية تلقائيًا عند اختيار الدولة";
      const note=document.createElement("small");
      note.className="rq-timezone-note";
      note.textContent="تُحدَّد تلقائيًا حسب الدولة المختارة";
      timezoneLabel.appendChild(note);
    }

    if(countryLabel&&!countryLabel.querySelector(".rq-country-picker")){
      const input=countryLabel.querySelector<HTMLInputElement>("input");
      if(input){
        input.style.display="none";
        const picker=document.createElement("div");
        picker.className="rq-country-picker";
        const search=document.createElement("input");
        search.placeholder="ابحث عن دولة...";
        search.autocomplete="off";
        search.setAttribute("aria-label","البحث عن دولة");
        const list=document.createElement("div");
        list.className="rq-country-list";

        const setSelected=(country:CountryItem)=>{
          setReactValue(input,country.code);
          if(timezoneInput)setReactValue(timezoneInput,country.timezone);
          search.value=`${country.flag} ${country.arabic}`;
          list.classList.remove("open");
          if(timezoneLabel){
            const note=timezoneLabel.querySelector(".rq-timezone-note");
            if(note)note.textContent=`تم التحديد تلقائيًا: ${country.timezone}`;
          }
        };

        const render=(q="")=>{
          const query=q.trim().toLocaleLowerCase();
          const matches=countries.filter(country=>!query||country.code.toLowerCase().includes(query)||country.arabic.toLocaleLowerCase().includes(query)||country.english.toLowerCase().includes(query));
          list.innerHTML="";
          matches.forEach(country=>{
            const b=document.createElement("button");
            b.type="button";
            b.className="rq-country-option";
            if(input.value===country.code)b.classList.add("selected");
            b.innerHTML=`<span class="rq-country-flag">${country.flag}</span><span><strong>${country.arabic}</strong><small>${country.english} · ${country.code}</small></span>`;
            b.onclick=()=>setSelected(country);
            list.appendChild(b);
          });
          if(!matches.length){
            const empty=document.createElement("div");
            empty.className="rq-country-empty";
            empty.textContent="لا توجد دولة مطابقة للبحث";
            list.appendChild(empty);
          }
        };

        const selected=countries.find(country=>country.code===input.value);
        if(selected)search.value=`${selected.flag} ${selected.arabic}`;
        search.onfocus=()=>{render("");list.classList.add("open")};
        search.oninput=()=>{render(search.value);list.classList.add("open")};
        const close=(event:PointerEvent)=>{if(!picker.contains(event.target as Node))list.classList.remove("open")};
        document.addEventListener("pointerdown",close);
        picker.append(search,list);
        countryLabel.appendChild(picker);
      }
    }

    const compensation=labels.find(l=>l.childNodes[0]?.textContent?.trim()==="نوع الحساب")?.querySelector<HTMLSelectElement>("select");
    if(compensation){
      let currencyLabel=grid.querySelector<HTMLLabelElement>(".rq-currency-field");
      if(compensation.value==="virtual_currency"&&!currencyLabel){
        currencyLabel=document.createElement("label");
        currencyLabel.className="rq-currency-field";
        currencyLabel.append("نوع العملة");
        const select=document.createElement("select");
        select.name="rq_currency_picker";
        currencies.forEach(([code,name])=>{
          const option=document.createElement("option");
          option.value=code;
          option.textContent=`${code} — ${name}`;
          select.appendChild(option);
        });
        currencyLabel.append(select);
        compensation.closest("label")?.after(currencyLabel);
      }
      compensation.onchange=()=>{enhance()};
      if(compensation.value!=="virtual_currency")currencyLabel?.remove();
    }
   });
  };

  enhance();
  const observer=new MutationObserver(enhance);
  observer.observe(document.body,{childList:true,subtree:true});
  return()=>observer.disconnect();
 },[]);

 return <style>{`
  .rq-country-picker{position:relative;margin-top:7px}
  .rq-country-picker>input{width:100%;box-sizing:border-box}
  .rq-country-list{display:none;position:absolute;z-index:3000;top:calc(100% + 6px);right:0;left:0;max-height:320px;overflow:auto;background:#fffdf8;border:1px solid #d8d7cc;border-radius:12px;padding:6px;box-shadow:0 18px 42px rgba(42,53,45,.18)}
  .rq-country-list.open{display:block}
  .rq-country-option{display:flex;width:100%;align-items:center;gap:10px;text-align:right;background:transparent;border:0;border-radius:9px;padding:9px 10px;color:#445149;font:inherit;cursor:pointer}
  .rq-country-option:hover,.rq-country-option.selected{background:#edf2ea;color:#3f5748}
  .rq-country-flag{font-size:20px;line-height:1}
  .rq-country-option>span:last-child{display:flex;min-width:0;flex:1;flex-direction:column;gap:1px}
  .rq-country-option strong{font-size:13px;color:inherit}.rq-country-option small{font-size:11px;color:#849088;direction:ltr;text-align:right}
  .rq-country-empty{padding:14px 10px;text-align:center;color:#7d8780;font-size:13px}
  .rq-currency-field{display:flex!important;flex-direction:column;gap:7px}.rq-currency-field select{width:100%}
  .rq-timezone-note{display:block;margin-top:5px;font-size:11px;color:#718073;font-weight:500}
  .student-ref-form label input[readonly]{background:#f3f6f0!important;color:#526a58!important;cursor:default}
 `}</style>;
}
