import{B as p}from"./index.348f3347.js";function b(o,e){const t=new Set;for(const i of e)o.has(i)&&t.add(i);return t}function v(o,e){const t=new Set(o);for(const i of e)t.add(i);return t}function c(o,e){const t=new Set(o);for(const i of e)t.delete(i);return t}function l(o){return Array.from(o).map(e=>`"${e}"`).join(", ")}class m extends p{static lc_name(){return"SequentialChain"}get inputKeys(){return this.inputVariables}get outputKeys(){return this.outputVariables}constructor(e){var t,i;if(super(e),Object.defineProperty(this,"chains",{enumerable:!0,configurable:!0,writable:!0,value:void 0}),Object.defineProperty(this,"inputVariables",{enumerable:!0,configurable:!0,writable:!0,value:void 0}),Object.defineProperty(this,"outputVariables",{enumerable:!0,configurable:!0,writable:!0,value:void 0}),Object.defineProperty(this,"returnAll",{enumerable:!0,configurable:!0,writable:!0,value:void 0}),this.chains=e.chains,this.inputVariables=e.inputVariables,this.outputVariables=(t=e.outputVariables)!=null?t:[],this.outputVariables.length>0&&e.returnAll)throw new Error("Either specify variables to return using `outputVariables` or use `returnAll` param. Cannot apply both conditions at the same time.");this.returnAll=(i=e.returnAll)!=null?i:!1,this._validateChains()}_validateChains(){var u,a;if(this.chains.length===0)throw new Error("Sequential chain must have at least one chain.");const e=(a=(u=this.memory)==null?void 0:u.memoryKeys)!=null?a:[],t=new Set(this.inputKeys),i=new Set(e),r=b(t,i);if(r.size>0)throw new Error(`The following keys: ${l(r)} are overlapping between memory and input keys of the chain variables. This can lead to unexpected behaviour. Please use input and memory keys that don't overlap.`);const n=v(t,i);for(const s of this.chains){let h=c(new Set(s.inputKeys),n);if(s.memory&&(h=c(h,new Set(s.memory.memoryKeys))),h.size>0)throw new Error(`Missing variables for chain "${s._chainType()}": ${l(h)}. Only got the following variables: ${l(n)}.`);const y=new Set(s.outputKeys),f=b(n,y);if(f.size>0)throw new Error(`The following output variables for chain "${s._chainType()}" are overlapping: ${l(f)}. This can lead to unexpected behaviour.`);for(const w of y)n.add(w)}if(this.outputVariables.length===0)if(this.returnAll){const s=c(n,t);this.outputVariables=Array.from(s)}else this.outputVariables=this.chains[this.chains.length-1].outputKeys;else{const s=c(new Set(this.outputVariables),new Set(n));if(s.size>0)throw new Error(`The following output variables were expected to be in the final chain output but were not found: ${l(s)}.`)}}async _call(e,t){let i={};const r=e;let n=0;for(const a of this.chains){n+=1,i=await a.call(r,t==null?void 0:t.getChild(`step_${n}`));for(const s of Object.keys(i))r[s]=i[s]}const u={};for(const a of this.outputVariables)u[a]=r[a];return u}_chainType(){return"sequential_chain"}static async deserialize(e){const t=[],i=e.input_variables,r=e.output_variables,n=e.chains;for(const u of n){const a=await p.deserialize(u);t.push(a)}return new m({chains:t,inputVariables:i,outputVariables:r})}serialize(){const e=[];for(const t of this.chains)e.push(t.serialize());return{_type:this._chainType(),input_variables:this.inputVariables,output_variables:this.outputVariables,chains:e}}}class d extends p{static lc_name(){return"SimpleSequentialChain"}get inputKeys(){return[this.inputKey]}get outputKeys(){return[this.outputKey]}constructor(e){var t;super(e),Object.defineProperty(this,"chains",{enumerable:!0,configurable:!0,writable:!0,value:void 0}),Object.defineProperty(this,"inputKey",{enumerable:!0,configurable:!0,writable:!0,value:"input"}),Object.defineProperty(this,"outputKey",{enumerable:!0,configurable:!0,writable:!0,value:"output"}),Object.defineProperty(this,"trimOutputs",{enumerable:!0,configurable:!0,writable:!0,value:void 0}),this.chains=e.chains,this.trimOutputs=(t=e.trimOutputs)!=null?t:!1,this._validateChains()}_validateChains(){for(const e of this.chains){if(e.inputKeys.filter(t=>{var i;return!((i=e.memory)!=null&&i.memoryKeys.includes(t))}).length!==1)throw new Error(`Chains used in SimpleSequentialChain should all have one input, got ${e.inputKeys.length} for ${e._chainType()}.`);if(e.outputKeys.length!==1)throw new Error(`Chains used in SimpleSequentialChain should all have one output, got ${e.outputKeys.length} for ${e._chainType()}.`)}}async _call(e,t){let i=e[this.inputKey],r=0;for(const n of this.chains)r+=1,i=(await n.call({[n.inputKeys[0]]:i,signal:e.signal},t==null?void 0:t.getChild(`step_${r}`)))[n.outputKeys[0]],this.trimOutputs&&(i=i.trim()),await(t==null?void 0:t.handleText(i));return{[this.outputKey]:i}}_chainType(){return"simple_sequential_chain"}static async deserialize(e){const t=[],i=e.chains;for(const r of i){const n=await p.deserialize(r);t.push(n)}return new d({chains:t})}serialize(){const e=[];for(const t of this.chains)e.push(t.serialize());return{_type:this._chainType(),chains:e}}}export{m as SequentialChain,d as SimpleSequentialChain};