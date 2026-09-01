"use client";

import { useEffect } from "react";

export default function RepeatDaysReset(){
  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      const target=event.target as HTMLElement;
      const label=target.closest("label");
      if(!label || !label.textContent?.includes("أيام محددة")) return;
      window.setTimeout(()=>{
        document.querySelectorAll<HTMLButtonElement>(".repeat-days .selected-day").forEach(button=>button.click());
      },0);
    };
    document.addEventListener("click",onClick);
    return ()=>document.removeEventListener("click",onClick);
  },[]);
  return null;
}
