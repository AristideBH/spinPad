import{e as C,b as m,k as N}from"./BjLAwn0n.js";import{ao as z,aY as j,am as a,a0 as A,aj as I,bg as L,aT as P,b1 as B,aV as T,bs as f,bp as V}from"./DhIqoAFn.js";import{s as Y}from"./16-Wx1ui.js";import{e as q,i as D}from"./g-Acecnr.js";import{e as E}from"./3N6i68oT.js";import{a as g}from"./Cog71QyP.js";import{p as o,r as F}from"./3tfRu6KN.js";/**
 * @file
 * @license @lucide/svelte v1.16.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @file
 * @license @lucide/svelte v1.16.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=s=>{for(const t in s)if(t.startsWith("aria-")||t==="role"||t==="title")return!0;return!1};/**
 * @file
 * @license @lucide/svelte v1.16.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J=Symbol("lucide-context"),K=()=>z(J);var M=N("<svg><!><!></svg>");function et(s,t){j(t,!0);const e=K()??{},b=o(t,"color",19,()=>e.color??"currentColor"),i=o(t,"size",19,()=>e.size??24),c=o(t,"strokeWidth",19,()=>e.strokeWidth??2),k=o(t,"absoluteStrokeWidth",19,()=>e.absoluteStrokeWidth??!1),v=o(t,"iconNode",19,()=>[]),l=F(t,["$$slots","$$events","$$legacy","name","color","size","strokeWidth","absoluteStrokeWidth","iconNode","children"]),W=f(()=>k()?Number(c())*24/Number(i()):c());var r=M();g(r,n=>({...G,...n,...l,width:i(),height:i(),stroke:b(),"stroke-width":a(W),class:["lucide-icon lucide",e.class,t.name&&`lucide-${t.name}`,t.class]}),[()=>!t.children&&!H(l)&&{"aria-hidden":"true"}]);var d=A(r);q(d,17,v,D,(n,p)=>{var h=f(()=>V(a(p),2));let x=()=>a(h)[0],_=()=>a(h)[1];var u=C(),S=I(u);E(S,x,!0,(y,O)=>{g(y,()=>({..._()}))}),m(n,u)});var w=L(d);Y(w,()=>t.children??P),B(r),m(s,r),T()}export{et as I};
