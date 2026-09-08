"use client";

import { useEffect } from "react";
import { countryFlag } from "../lib/country";

const countries=[
["EG","مصر"],["FR","فرنسا"],["BE","بلجيكا"],["NL","هولندا"],["GB","المملكة المتحدة"],["US","الولايات المتحدة"],["CA","كندا"],["DE","ألمانيا"],["ES","إسبانيا"],["IT","إيطاليا"],["CH","سويسرا"],["SE","السويد"],["NO","النرويج"],["DK","الدنمارك"],["AE","الإمارات العربية المتحدة"],["SA","المملكة العربية السعودية"],["QA","قطر"],["KW","الكويت"],["BH","البحرين"],["OM","عُمان"],["MA","المغرب"],["DZ","الجزائر"],["TN","تونس"],["TR","تركيا"],["PK","باكستان"],["IN","الهند"],["AU","أستراليا"]
] as const;
const currencies=[["EUR","اليورو"],["USD","الدولار الأمريكي"],["GBP","الجنيه الإسترليني"],["CHF","الفرنك السويسري"],["CAD","الدولار الكندي"],["AUD","الدولار الأسترالي"],["AED","الدرهم الإماراتي"],["SAR","الريال السعودي"],["QAR","الريال القطري"],["KWD","الدينار الكويتي"],["EGP","الجنيه المصري"],["MAD","الدرهم المغربي"],["TRY","الليرة التركية"]] as const;

function setReactValue(el:HTMLInputElement|HTMLSelectElement,value:string){const proto=Object.getPrototypeOf(el);const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;setter?.call(el,value);el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}

export default function StudentFormEnhancer(){
 useEffect(()=>{
  const enhance=()=>{
   document.querySelectorAll<HTMLFormElement>(".student-ref-modal").forEach(form=>{
    const grid=form.querySelector<HTMLElement>(".student-ref-form"); if(!grid)return;
    const labels=[...grid.querySelectorAll<HTMLLabelElement>("label")];
    const countryLabel=labels.find(l=>l.childNodes[0]?.textContent?.trim()==="الدولة");
    if(countryLabel&&!countryLabel.querySelector(".rq-country-picker")){
      const input=countryLabel.querySelector<HTMLInputElement>("input"); if(input){
        input.style.display="none";
        const picker=document.createElement("div"); picker.className="rq-country-picker";
        const search=document.createElement("input"); search.placeholder="ابحث عن الدولة..."; search.autocomplete="off";
        const list=document.createElement("div"); list.className="rq-country-list";
        const render=(q="")=>{const query=q.trim().toLowerCase();list.innerHTML="";countries.filter(([code,name])=>!query||name.toLowerCase().includes(query)||code.toLowerCase().includes(query)).forEach(([code,name])=>{const b=document.createElement("button");b.type="button";b.textContent=`${countryFlag(code)}  ${name}`;if(input.value===code)b.classList.add("selected");b.onclick=()=>{setReactValue(input,code);search.value=`${countryFlag(code)} ${name}`;list.classList.remove("open");};list.appendChild(b);});};
        const selected=countries.find(([c])=>c===input.value); if(selected)search.value=`${countryFlag(selected[0])} ${selected[1]}`;
        search.onfocus=()=>{render(search.value);list.classList.add("open")}; search.oninput=()=>{render(search.value);list.classList.add("open")};
        picker.append(search,list); countryLabel.appendChild(picker);
      }
    }
    const compensation=labels.find(l=>l.childNodes[0]?.textContent?.trim()==="نوع الحساب")?.querySelector<HTMLSelectElement>("select");
    if(compensation){
      let currencyLabel=grid.querySelector<HTMLLabelElement>(".rq-currency-field");
      if(compensation.value==="virtual_currency"&&!currencyLabel){
        currencyLabel=document.createElement("label");currencyLabel.className="rq-currency-field";currencyLabel.append("نوع العملة");
        const select=document.createElement("select"); select.name="rq_currency_code";
        const existing=form.querySelector<HTMLInputElement|HTMLSelectElement>("[name='currency_code']");
        currencies.forEach(([code,name])=>{const o=document.createElement("option");o.value=code;o.textContent=`${code} — ${name}`;if(existing?.value===code)o.selected=true;select.appendChild(o)});
        select.onchange=()=>{if(existing)setReactValue(existing,select.value);else{const hidden=document.createElement("input");hidden.type="hidden";hidden.name="currency_code";hidden.value=select.value;currencyLabel?.appendChild(hidden)}};
        compensation.closest("label")?.after(currencyLabel);
      }
      if(compensation.value!=="virtual_currency")currencyLabel?.remove();
    }
   });
  };
  enhance();const observer=new MutationObserver(enhance);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();
 },[]);
 return <style>{`.rq-country-picker{position:relative;margin-top:7px}.rq-country-picker>input{width:100%;box-sizing:border-box}.rq-country-list{display:none;position:absolute;z-index:1000;top:calc(100% + 5px);right:0;left:0;max-height:220px;overflow:auto;background:#fffdf8;border:1px solid #d8d7cc;border-radius:12px;padding:6px;box-shadow:0 16px 38px rgba(42,53,45,.16)}.rq-country-list.open{display:block}.rq-country-list button{display:block;width:100%;text-align:right;background:transparent;border:0;border-radius:8px;padding:9px 10px;color:#445149;font:inherit;cursor:pointer}.rq-country-list button:hover,.rq-country-list button.selected{background:#edf2ea;color:#3f5748}.rq-currency-field{display:flex!important;flex-direction:column;gap:7px}.rq-currency-field select{width:100%}`}</style>;
}
