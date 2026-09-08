"use client";

import { useEffect } from "react";
import { countryFlag } from "../lib/country";
import { COUNTRY_CODES } from "../lib/countries";

const currencies=[
  ["EUR","اليورو"],["USD","الدولار الأمريكي"],["GBP","الجنيه الإسترليني"],["CHF","الفرنك السويسري"],["CAD","الدولار الكندي"],["AUD","الدولار الأسترالي"],["AED","الدرهم الإماراتي"],["SAR","الريال السعودي"],["QAR","الريال القطري"],["KWD","الدينار الكويتي"],["EGP","الجنيه المصري"],["MAD","الدرهم المغربي"],["TRY","الليرة التركية"],["BHD","الدينار البحريني"],["OMR","الريال العُماني"],["JOD","الدينار الأردني"]
] as const;

type CountryItem={code:string;arabic:string;english:string;flag:string};

function setReactValue(el:HTMLInputElement|HTMLSelectElement,value:string){
  const proto=Object.getPrototypeOf(el);
  const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;
  setter?.call(el,value);
  el.dispatchEvent(new Event("input",{bubbles:true}));
  el.dispatchEvent(new Event("change",{bubbles:true}));
}

export default function StudentFormEnhancer(){
 useEffect(()=>{
  const arabicNames=new Intl.DisplayNames(["ar"],{type:"region"});
  const englishNames=new Intl.DisplayNames(["en"],{type:"region"});
  const countries:CountryItem[]=COUNTRY_CODES.map(code=>({code,arabic:arabicNames.of(code)||code,english:englishNames.of(code)||code,flag:countryFlag(code)}));

  const enhance=()=>{
   document.querySelectorAll<HTMLFormElement>(".student-ref-modal").forEach(form=>{
    const grid=form.querySelector<HTMLElement>(".student-ref-form");
    if(!grid)return;
    const labels=[...grid.querySelectorAll<HTMLLabelElement>("label")];
    const countryLabel=labels.find(l=>l.childNodes[0]?.textContent?.trim()==="الدولة");

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
          search.value=`${country.flag} ${country.arabic}`;
          list.classList.remove("open");
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
        search.onfocus=()=>{render(search.value);list.classList.add("open")};
        search.oninput=()=>{render(search.value);list.classList.add("open")};
        document.addEventListener("pointerdown",event=>{if(!picker.contains(event.target as Node))list.classList.remove("open")});
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
        const hidden=document.createElement("input");
        hidden.type="hidden";
        hidden.name="currency_code";
        const select=document.createElement("select");
        select.name="rq_currency_picker";
        const existingValue=(form.querySelector<HTMLInputElement>("input[name='currency_code']")?.value)||"EUR";
        hidden.value=existingValue;
        currencies.forEach(([code,name])=>{
          const option=document.createElement("option");
          option.value=code;
          option.textContent=`${code} — ${name}`;
          if(existingValue===code)option.selected=true;
          select.appendChild(option);
        });
        select.onchange=()=>{hidden.value=select.value;hidden.dispatchEvent(new Event("input",{bubbles:true}));hidden.dispatchEvent(new Event("change",{bubbles:true}));};
        currencyLabel.append(select,hidden);
        compensation.closest("label")?.after(currencyLabel);
      }
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
  .rq-country-list{display:none;position:absolute;z-index:3000;top:calc(100% + 6px);right:0;left:0;max-height:300px;overflow:auto;background:#fffdf8;border:1px solid #d8d7cc;border-radius:12px;padding:6px;box-shadow:0 18px 42px rgba(42,53,45,.18)}
  .rq-country-list.open{display:block}
  .rq-country-option{display:flex;width:100%;align-items:center;gap:10px;text-align:right;background:transparent;border:0;border-radius:9px;padding:9px 10px;color:#445149;font:inherit;cursor:pointer}
  .rq-country-option:hover,.rq-country-option.selected{background:#edf2ea;color:#3f5748}
  .rq-country-flag{font-size:20px;line-height:1}
  .rq-country-option>span:last-child{display:flex;min-width:0;flex:1;flex-direction:column;gap:1px}
  .rq-country-option strong{font-size:13px;color:inherit}.rq-country-option small{font-size:11px;color:#849088;direction:ltr;text-align:right}
  .rq-country-empty{padding:14px 10px;text-align:center;color:#7d8780;font-size:13px}
  .rq-currency-field{display:flex!important;flex-direction:column;gap:7px}.rq-currency-field select{width:100%}
 `}</style>;
}
