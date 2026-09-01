"use client";

import { useEffect } from "react";

export default function RepeatDaysReset(){
  useEffect(()=>{
    const enhance=()=>{
      const labels=[...document.querySelectorAll<HTMLLabelElement>(".repeat-options label")];
      const oldWeekly=labels.find(label=>label.textContent?.includes("أسبوعيًا في نفس اليوم"));
      const customDays=labels.find(label=>label.textContent?.includes("أيام محددة"));
      if(oldWeekly) oldWeekly.style.display="none";
      if(customDays && !customDays.dataset.enhanced){
        customDays.dataset.enhanced="true";
        const textNode=[...customDays.childNodes].find(node=>node.nodeType===Node.TEXT_NODE && node.textContent?.includes("أيام محددة"));
        if(textNode) textNode.textContent=" أسبوعيًا";
      }
    };

    enhance();
    const observer=new MutationObserver(enhance);
    observer.observe(document.body,{childList:true,subtree:true});

    const onClick=(event:MouseEvent)=>{
      const target=event.target as HTMLElement;
      const label=target.closest(".repeat-options label");
      if(!label || !label.textContent?.includes("أسبوعيًا")) return;
      if(label.textContent.includes("في نفس اليوم")) return;
      window.setTimeout(()=>{
        document.querySelectorAll<HTMLButtonElement>(".repeat-days .selected-day").forEach(button=>button.click());
      },0);
    };

    document.addEventListener("click",onClick);
    return ()=>{observer.disconnect();document.removeEventListener("click",onClick)};
  },[]);
  return null;
}
