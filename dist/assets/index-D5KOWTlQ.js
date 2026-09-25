var k=Object.defineProperty;var N=(m,e,t)=>e in m?k(m,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):m[e]=t;var d=(m,e,t)=>N(m,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();const x={ENGINES:"apex_engines_data_v1",THEME:"apex_theme_mode_v1",COMPARE:"apex_compare_ids_v1"};class E{static saveEngines(e){try{localStorage.setItem(x.ENGINES,JSON.stringify(e))}catch(t){console.error("Erreur lors de la sauvegarde dans LocalStorage:",t)}}static getEngines(){try{const e=localStorage.getItem(x.ENGINES);if(!e)return null;const t=JSON.parse(e);return Array.isArray(t)?t:null}catch(e){return console.error("Erreur lors de la lecture du LocalStorage:",e),null}}static saveTheme(e){try{localStorage.setItem(x.THEME,e)}catch(t){console.error("Erreur lors de la sauvegarde du thème:",t)}}static getTheme(){try{const e=localStorage.getItem(x.THEME);if(e==="dark"||e==="light"||e==="auto")return e}catch(e){console.error("Erreur lors de la lecture du thème:",e)}return"auto"}static saveCompareIds(e){try{localStorage.setItem(x.COMPARE,JSON.stringify(e))}catch(t){console.error("Erreur lors de la sauvegarde des comparaisons:",t)}}static getCompareIds(){try{const e=localStorage.getItem(x.COMPARE);return e?JSON.parse(e):[]}catch{return[]}}static exportToJsonFile(e){const t="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(e,null,2)),s=document.createElement("a");s.setAttribute("href",t),s.setAttribute("download",`apex_engines_backup_${new Date().toISOString().slice(0,10)}.json`),document.body.appendChild(s),s.click(),s.remove()}static clearStorage(){try{localStorage.removeItem(x.ENGINES),localStorage.removeItem(x.COMPARE)}catch(e){console.error("Erreur lors du nettoyage du LocalStorage:",e)}}}function R(m,e){return new Proxy(m,{set(t,s,i,r){const n=String(s),a=t[s],l=typeof i=="object"&&i!==null&&!i._isProxy?R(i,e):i,p=Reflect.set(t,s,l,r);return a!==i&&e(n,i),p},deleteProperty(t,s){const i=String(s),r=s in t,n=Reflect.deleteProperty(t,s);return r&&e(i,void 0),n},get(t,s,i){return s==="_isProxy"?!0:Reflect.get(t,s,i)}})}class M{constructor(){d(this,"rawState");d(this,"state");d(this,"listeners",new Set);const e=E.getTheme(),t=E.getCompareIds();this.rawState={engines:[],filters:{searchQuery:"",configuration:"ALL",fuel:"ALL",aspiration:"ALL",onlyFavorites:!1,minPower:0,maxPower:2e3,sortBy:"power",sortOrder:"desc"},theme:e,selectedEngineId:null,compareEngineIds:t,isLoading:!0,errorMessage:null,activeView:"grid"},this.state=R(this.rawState,(s,i)=>{this.handleStateChange(s,i)})}handleStateChange(e,t){(e==="engines"||!isNaN(Number(e)))&&E.saveEngines(this.state.engines),e==="theme"&&E.saveTheme(this.state.theme),e==="compareEngineIds"&&E.saveCompareIds(this.state.compareEngineIds),this.notify(e)}subscribe(e){return this.listeners.add(e),e(this.state),()=>this.listeners.delete(e)}notify(e){this.listeners.forEach(t=>{try{t(this.state,e)}catch(s){console.error("Erreur dans un listener de store:",s)}})}setEngines(e){this.state.engines=e,this.state.isLoading=!1,this.state.errorMessage=null}addEngine(e){const t={...e,id:"eng-"+Date.now().toString(36)+Math.random().toString(36).substring(2,6),isFavorite:!1,likes:0,createdAt:new Date().toISOString()};return this.state.engines=[t,...this.state.engines],t}updateEngine(e,t){const s=this.state.engines.findIndex(a=>a.id===e);if(s===-1)return!1;const r={...this.state.engines[s],...t,updatedAt:new Date().toISOString()},n=[...this.state.engines];return n[s]=r,this.state.engines=n,!0}deleteEngine(e){const t=this.state.engines.length;return this.state.engines=this.state.engines.filter(s=>s.id!==e),this.state.compareEngineIds.includes(e)&&(this.state.compareEngineIds=this.state.compareEngineIds.filter(s=>s!==e)),this.state.engines.length<t}toggleFavorite(e){const t=this.state.engines.find(s=>s.id===e);t&&this.updateEngine(e,{isFavorite:!t.isFavorite})}incrementLikes(e){const t=this.state.engines.find(s=>s.id===e);t&&this.updateEngine(e,{likes:(t.likes||0)+1})}setFilters(e){this.state.filters={...this.state.filters,...e}}resetFilters(){this.state.filters={searchQuery:"",configuration:"ALL",fuel:"ALL",aspiration:"ALL",onlyFavorites:!1,minPower:0,maxPower:2e3,sortBy:"power",sortOrder:"desc"}}setTheme(e){this.state.theme=e}setSelectedEngine(e){this.state.selectedEngineId=e}toggleCompare(e){const t=[...this.state.compareEngineIds],s=t.indexOf(e);return s>=0?(t.splice(s,1),this.state.compareEngineIds=t,!0):t.length>=3?!1:(t.push(e),this.state.compareEngineIds=t,!0)}clearCompare(){this.state.compareEngineIds=[]}setActiveView(e){this.state.activeView=e}getFilteredEngines(){const{searchQuery:e,configuration:t,fuel:s,aspiration:i,onlyFavorites:r,minPower:n,maxPower:a,sortBy:l,sortOrder:p}=this.state.filters,u=e.trim().toLowerCase();return this.state.engines.filter(o=>{if(u){const b=o.name.toLowerCase().includes(u),y=o.manufacturer.toLowerCase().includes(u),w=o.description.toLowerCase().includes(u),T=o.vehicles.some(q=>q.toLowerCase().includes(u));if(!b&&!y&&!w&&!T)return!1}return!(t!=="ALL"&&o.configuration!==t||s!=="ALL"&&o.fuel!==s||i!=="ALL"&&o.aspiration!==i||r&&!o.isFavorite||o.power<n||o.power>a)}).sort((o,b)=>{let y=0;return l==="power"?y=o.power-b.power:l==="torque"?y=o.torque-b.torque:l==="displacement"?y=o.displacement-b.displacement:l==="maxRpm"?y=o.maxRpm-b.maxRpm:l==="likes"?y=o.likes-b.likes:l==="name"?y=o.name.localeCompare(b.name):l==="manufacturer"&&(y=o.manufacturer.localeCompare(b.manufacturer)),p==="asc"?y:-y})}getStats(){const e=this.state.engines,t=e.length;if(t===0)return{total:0,avgPower:0,maxPowerEngine:null,highestRpmEngine:null,topLikedEngine:null,fuelBreakdown:{},configBreakdown:{}};const s=e.reduce((u,o)=>u+o.power,0),i=Math.round(s/t),r=[...e].sort((u,o)=>o.power-u.power)[0],n=[...e].sort((u,o)=>o.maxRpm-u.maxRpm)[0],a=[...e].sort((u,o)=>o.likes-u.likes)[0],l=e.reduce((u,o)=>(u[o.fuel]=(u[o.fuel]||0)+1,u),{}),p=e.reduce((u,o)=>(u[o.configuration]=(u[o.configuration]||0)+1,u),{});return{total:t,avgPower:i,maxPowerEngine:r,highestRpmEngine:n,topLikedEngine:a,fuelBreakdown:l,configBreakdown:p}}}const c=new M;class L{static async loadInitialEngines(){const e=E.getEngines();return e&&e.length>0?e:this.fetchFromApi()}static async fetchFromApi(){try{const e=await fetch(this.DATA_URL);if(!e.ok)throw new Error(`Erreur HTTP: ${e.status} ${e.statusText}`);const t=await e.json();return E.saveEngines(t),t}catch(e){throw console.error("Erreur lors du Fetch des données moteurs:",e),e}}static async resetToDefault(){return E.clearStorage(),this.fetchFromApi()}}d(L,"DATA_URL","/data/engines.json");function $(m,e={},t=[]){const s=document.createElement(m);for(const[i,r]of Object.entries(e))i==="className"||i==="class"?s.className=String(r):i.startsWith("data-")?s.setAttribute(i,String(r)):typeof r=="boolean"?r&&s.setAttribute(i,""):s.setAttribute(i,String(r));for(const i of t)typeof i=="string"?s.appendChild(document.createTextNode(i)):typeof i=="object"&&i!==null&&"nodeType"in i&&s.appendChild(i);return s}function P(m){for(;m.firstChild;)m.removeChild(m.firstChild)}function f(m){const e=document.createElement("div");return e.textContent=m,e.innerHTML}function g(m){return new Intl.NumberFormat("fr-FR").format(m)}class v{static getContainer(){return(!this.container||!document.body.contains(this.container))&&(this.container=$("div",{class:"toast-container","aria-live":"polite"}),document.body.appendChild(this.container)),this.container}static show(e,t="info",s=3500){const i=this.getContainer(),r={success:"✓",error:"✕",info:"ℹ"},n=$("div",{class:`toast toast-${t}`},[$("span",{style:"font-weight: 800; font-size: 1.1rem;"},[r[t]]),$("span",{style:"flex: 1;"},[e])]);i.appendChild(n),setTimeout(()=>{n.classList.add("removing"),setTimeout(()=>{n.remove()},250)},s)}}d(v,"container",null);class I{constructor(){d(this,"element");this.element=document.getElementById("app-navbar")||document.createElement("header"),this.render(),this.initThemeWatcher()}initThemeWatcher(){this.applyTheme(c.state.theme),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{c.state.theme==="auto"&&this.applyTheme("auto")})}applyTheme(e){const t=document.documentElement;if(e==="auto"){const s=window.matchMedia("(prefers-color-scheme: dark)").matches;t.setAttribute("data-theme",s?"dark":"light")}else t.setAttribute("data-theme",e)}render(){const e=c.state.theme,t={dark:"🌙",light:"☀️",auto:"💻"},s={dark:"light",light:"auto",auto:"dark"};this.element.className="app-header",this.element.innerHTML=`
      <div class="header-inner">
        <div class="brand-container" id="brand-home-btn">
          <div class="brand-logo">🏎️</div>
          <div class="brand-info">
            <h1>Apex<span>Engine</span></h1>
            <p>Encyclopédie & Comparateur de Moteurs</p>
          </div>
        </div>

        <div class="nav-center">
          <div class="search-input-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              class="search-input" 
              id="global-search-input" 
              placeholder="Rechercher un moteur, V8, Ferrari, 2JZ, Turbo..." 
              value="${c.state.filters.searchQuery}"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="nav-actions">
          <button class="btn btn-secondary" id="btn-theme-toggle" title="Changer le thème (${e})">
            <span>${t[e]}</span>
            <span class="btn-text" style="text-transform: capitalize;">${e}</span>
          </button>

          <button class="btn btn-secondary" id="btn-export-json" title="Exporter les données en JSON">
            <span>💾</span>
            <span class="btn-text">Export</span>
          </button>

          <button class="btn btn-secondary" id="btn-reset-data" title="Réinitialiser la base par défaut">
            <span>🔄</span>
            <span class="btn-text">Reset</span>
          </button>

          <button class="btn btn-primary" id="btn-add-engine">
            <span>➕</span>
            <span class="btn-text">Ajouter un moteur</span>
          </button>
        </div>
      </div>
    `,this.attachEvents(s[e])}attachEvents(e){const t=this.element.querySelector("#global-search-input");t&&t.addEventListener("input",l=>{const p=l.target.value;c.setFilters({searchQuery:p})});const s=this.element.querySelector("#btn-theme-toggle");s&&s.addEventListener("click",()=>{c.setTheme(e),this.applyTheme(e),this.render(),v.show(`Thème basculé sur : ${e}`,"info")});const i=this.element.querySelector("#btn-export-json");i&&i.addEventListener("click",()=>{E.exportToJsonFile(c.state.engines),v.show("Fichier JSON exporté avec succès !","success")});const r=this.element.querySelector("#btn-reset-data");r&&r.addEventListener("click",async()=>{if(confirm("Voulez-vous recharger la base de données de moteurs initiale ? Toutes vos modifications locales seront réinitialisées."))try{const l=await L.resetToDefault();c.setEngines(l),v.show("Base de données réinitialisée via Fetch API !","success")}catch{v.show("Erreur lors du rechargement des données.","error")}});const n=this.element.querySelector("#btn-add-engine");n&&n.addEventListener("click",()=>{document.dispatchEvent(new CustomEvent("open-engine-form",{detail:{mode:"create"}}))});const a=this.element.querySelector("#brand-home-btn");a&&a.addEventListener("click",()=>{c.resetFilters(),t&&(t.value="")})}}class B{constructor(){d(this,"element");this.element=document.getElementById("stats-overview-container")||document.createElement("section"),c.subscribe(()=>this.render())}render(){const e=c.getStats();if(e.total===0){this.element.innerHTML="";return}this.element.className="stats-banner anim-fade-in",this.element.innerHTML=`
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏎️</div>
          <div class="stat-data">
            <h4>Moteurs répertoriés</h4>
            <div class="stat-value">${e.total}</div>
            <div class="stat-sub">Thermiques, Hybrides & Électriques</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-data">
            <h4>Puissance moyenne</h4>
            <div class="stat-value">${g(e.avgPower)} <span style="font-size: 0.9rem; font-weight: 500;">ch</span></div>
            <div class="stat-sub">Toutes architectures confondues</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-data">
            <h4>Le plus puissant</h4>
            <div class="stat-value">${e.maxPowerEngine?`${g(e.maxPowerEngine.power)} ch`:"-"}</div>
            <div class="stat-sub">${e.maxPowerEngine?e.maxPowerEngine.name:""}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-data">
            <h4>Régime max record</h4>
            <div class="stat-value">${e.highestRpmEngine?`${g(e.highestRpmEngine.maxRpm)} tr/min`:"-"}</div>
            <div class="stat-sub">${e.highestRpmEngine?e.highestRpmEngine.name:""}</div>
          </div>
        </div>
      </div>
    `}}class V{constructor(){d(this,"element");this.element=document.getElementById("filter-bar-container")||document.createElement("section"),c.subscribe((e,t)=>{(!t||t==="filters"||t==="engines")&&this.render()})}render(){const{configuration:e,fuel:t,aspiration:s,onlyFavorites:i,sortBy:r,sortOrder:n}=c.state.filters,a=[{id:"ALL",label:"Toutes les architectures"},{id:"V8",label:"V8"},{id:"V12",label:"V12"},{id:"V10",label:"V10"},{id:"Flat-6",label:"Flat-6 Boxer"},{id:"6 en ligne",label:"6 en ligne (L6)"},{id:"4 en ligne",label:"4 en ligne (L4)"},{id:"W16",label:"W16 Quad-Turbo"},{id:"Rotatif",label:"Wankel Rotatif"},{id:"Électrique",label:"Électrique"}];this.element.className="filter-section anim-fade-in",this.element.innerHTML=`
      <div class="filter-bar">
        <!-- Ligne 1 : Pilules d'architectures rapides -->
        <div class="filter-pills">
          ${a.map(l=>`
            <button 
              class="pill-btn ${e===l.id?"active":""}" 
              data-config="${l.id}"
            >
              ${l.label}
            </button>
          `).join("")}
        </div>

        <!-- Ligne 2 : Sélecteurs avancés et tri -->
        <div class="filter-row">
          <div class="filter-selects">
            <!-- Carburant -->
            <select class="custom-select" id="filter-fuel">
              <option value="ALL" ${t==="ALL"?"selected":""}>⛽ Tous les carburants</option>
              <option value="Essence" ${t==="Essence"?"selected":""}>Essence</option>
              <option value="Diesel" ${t==="Diesel"?"selected":""}>Diesel</option>
              <option value="Hybride" ${t==="Hybride"?"selected":""}>Hybride</option>
              <option value="Électrique" ${t==="Électrique"?"selected":""}>Électrique</option>
            </select>

            <!-- Aspiration -->
            <select class="custom-select" id="filter-aspiration">
              <option value="ALL" ${s==="ALL"?"selected":""}>🌪️ Toute alimentation</option>
              <option value="Atmosphérique" ${s==="Atmosphérique"?"selected":""}>Atmosphérique</option>
              <option value="Turbo" ${s==="Turbo"?"selected":""}>Turbo</option>
              <option value="Bi-Turbo" ${s==="Bi-Turbo"?"selected":""}>Bi-Turbo</option>
              <option value="Quad-Turbo" ${s==="Quad-Turbo"?"selected":""}>Quad-Turbo</option>
              <option value="Compresseur" ${s==="Compresseur"?"selected":""}>Compresseur</option>
            </select>

            <!-- Bouton Favoris -->
            <button class="pill-btn ${i?"active":""}" id="btn-toggle-favs">
              <span>❤️ Favoris uniquement</span>
            </button>
          </div>

          <!-- Tri -->
          <div class="filter-selects">
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Trier par :</span>
            <select class="custom-select" id="sort-by-select">
              <option value="power" ${r==="power"?"selected":""}>⚡ Puissance (ch)</option>
              <option value="torque" ${r==="torque"?"selected":""}>⚙️ Couple (Nm)</option>
              <option value="displacement" ${r==="displacement"?"selected":""}>🧪 Cylindrée (cm³)</option>
              <option value="maxRpm" ${r==="maxRpm"?"selected":""}>⏱️ Régime max (RPM)</option>
              <option value="likes" ${r==="likes"?"selected":""}>❤️ Likes</option>
              <option value="name" ${r==="name"?"selected":""}>🔤 Nom</option>
              <option value="manufacturer" ${r==="manufacturer"?"selected":""}>🏷️ Marque</option>
            </select>

            <button class="btn-icon" id="btn-toggle-sort-order" title="Inverser l'ordre (${n==="asc"?"Croissant":"Décroissant"})">
              <span>${n==="asc"?"↑":"↓"}</span>
            </button>

            <button class="btn btn-secondary" id="btn-reset-filters" style="font-size: 0.8rem; padding: 0.45rem 0.75rem;">
              <span>Effacer</span>
            </button>
          </div>
        </div>
      </div>
    `,this.attachEvents()}attachEvents(){this.element.querySelectorAll(".pill-btn[data-config]").forEach(l=>{l.addEventListener("click",()=>{const p=l.getAttribute("data-config")||"ALL";c.setFilters({configuration:p})})});const t=this.element.querySelector("#filter-fuel");t&&t.addEventListener("change",()=>{c.setFilters({fuel:t.value})});const s=this.element.querySelector("#filter-aspiration");s&&s.addEventListener("change",()=>{c.setFilters({aspiration:s.value})});const i=this.element.querySelector("#btn-toggle-favs");i&&i.addEventListener("click",()=>{c.setFilters({onlyFavorites:!c.state.filters.onlyFavorites})});const r=this.element.querySelector("#sort-by-select");r&&r.addEventListener("change",()=>{c.setFilters({sortBy:r.value})});const n=this.element.querySelector("#btn-toggle-sort-order");n&&n.addEventListener("click",()=>{const l=c.state.filters.sortOrder==="asc"?"desc":"asc";c.setFilters({sortOrder:l})});const a=this.element.querySelector("#btn-reset-filters");a&&a.addEventListener("click",()=>{c.resetFilters();const l=document.getElementById("global-search-input");l&&(l.value="")})}}class h{static initContext(){if(!this.ctx){const e=window.AudioContext||window.webkitAudioContext;this.ctx=new e}this.ctx.state==="suspended"&&this.ctx.resume()}static makeSoftSaturationCurve(){const t=new Float32Array(44100),s=1.15;for(let i=0;i<44100;++i){const r=i*2/44100-1;t[i]=Math.tanh(r*s)/Math.tanh(s)}return t}static createNoiseBuffer(){if(!this.ctx)return null;const e=this.ctx.sampleRate*2,t=this.ctx.createBuffer(1,e,this.ctx.sampleRate),s=t.getChannelData(0);for(let i=0;i<e;i++)s[i]=Math.random()*2-1;return t}static start(e=500,t=8500){if(this.initContext(),!this.ctx)return;this.isPlaying&&this.stop();let s;typeof e=="object"?s=e:s={soundPitch:e,maxRpm:t,configuration:"V8",aspiration:"Atmosphérique",fuel:"Essence",name:"Moteur"},this.currentEngine=s,this.config=s.configuration||"V8",this.isElectric=s.configuration==="Électrique"||s.fuel==="Électrique",this.isTurbo=["Turbo","Bi-Turbo","Quad-Turbo"].includes(s.aspiration||""),this.maxRpm=s.maxRpm||8500,this.idleRpm=this.isElectric?0:Math.round(this.maxRpm*.11),this.currentRpm=this.idleRpm;const i=this.ctx.currentTime;this.compressor=this.ctx.createDynamicsCompressor(),this.compressor.threshold.setValueAtTime(-18,i),this.compressor.knee.setValueAtTime(12,i),this.compressor.ratio.setValueAtTime(8,i),this.compressor.attack.setValueAtTime(.005,i),this.compressor.release.setValueAtTime(.12,i),this.masterGain=this.ctx.createGain(),this.masterGain.gain.setValueAtTime(.001,i),this.masterGain.gain.exponentialRampToValueAtTime(.16,i+.12),this.waveShaper=this.ctx.createWaveShaper(),this.waveShaper.curve=this.makeSoftSaturationCurve(),this.waveShaper.oversample="4x",this.exhaustFilter=this.ctx.createBiquadFilter(),this.exhaustFilter.type="lowpass",this.exhaustFilter.frequency.setValueAtTime(450,i),this.exhaustFilter.Q.setValueAtTime(1.2,i),this.setupOscillators(),this.isTurbo&&!this.isElectric&&this.setupTurbo(),this.waveShaper.connect(this.exhaustFilter),this.exhaustFilter.connect(this.compressor),this.compressor.connect(this.masterGain),this.masterGain.connect(this.ctx.destination),this.updateFrequency(),this.isPlaying=!0}static setupOscillators(){if(!this.ctx||!this.waveShaper)return;this.osc1=this.ctx.createOscillator(),this.osc2=this.ctx.createOscillator(),this.osc3=this.ctx.createOscillator(),this.osc4=this.ctx.createOscillator();const e=this.ctx.createGain(),t=this.ctx.createGain(),s=this.ctx.createGain(),i=this.ctx.createGain();this.isElectric?(this.osc1.type="sine",this.osc2.type="triangle",this.osc3.type="sine",this.osc4.type="sine",e.gain.value=.22,t.gain.value=.1,s.gain.value=.08,i.gain.value=.05):this.config==="Rotatif"?(this.osc1.type="sawtooth",this.osc2.type="triangle",this.osc3.type="sine",this.osc4.type="triangle",e.gain.value=.18,t.gain.value=.12,s.gain.value=.1,i.gain.value=.06):this.config==="V12"?(this.osc1.type="sawtooth",this.osc2.type="triangle",this.osc3.type="sine",this.osc4.type="sawtooth",e.gain.value=.16,t.gain.value=.14,s.gain.value=.12,i.gain.value=.06):this.config==="V10"?(this.osc1.type="sawtooth",this.osc2.type="triangle",this.osc3.type="sawtooth",this.osc4.type="sine",e.gain.value=.18,t.gain.value=.12,s.gain.value=.1,i.gain.value=.05):this.config==="5 en ligne"?(this.osc1.type="sawtooth",this.osc2.type="triangle",this.osc3.type="sawtooth",this.osc4.type="sine",e.gain.value=.18,t.gain.value=.12,s.gain.value=.1,i.gain.value=.05,this.lfo=this.ctx.createOscillator(),this.lfo.type="sine",this.lfoGain=this.ctx.createGain(),this.lfoGain.gain.value=2.5,this.lfo.connect(this.lfoGain),this.lfoGain.connect(this.osc1.frequency),this.lfo.start()):this.config==="Flat-6"?(this.osc1.type="sawtooth",this.osc2.type="triangle",this.osc3.type="sine",this.osc4.type="sawtooth",e.gain.value=.18,t.gain.value=.12,s.gain.value=.12,i.gain.value=.06):this.config==="W16"?(this.osc1.type="sawtooth",this.osc2.type="triangle",this.osc3.type="sine",this.osc4.type="sine",e.gain.value=.15,t.gain.value=.1,s.gain.value=.18,i.gain.value=.04):(this.osc1.type="sawtooth",this.osc2.type="triangle",this.osc3.type="sine",this.osc4.type="triangle",e.gain.value=.18,t.gain.value=.12,s.gain.value=.12,i.gain.value=.05),this.osc1.connect(e),this.osc2.connect(t),this.osc3.connect(s),this.osc4.connect(i),e.connect(this.waveShaper),t.connect(this.waveShaper),s.connect(this.waveShaper),i.connect(this.waveShaper),this.osc1.start(),this.osc2.start(),this.osc3.start(),this.osc4.start()}static setupTurbo(){if(!this.ctx||!this.compressor)return;const e=this.createNoiseBuffer();e&&(this.turboNoise=this.ctx.createBufferSource(),this.turboNoise.buffer=e,this.turboNoise.loop=!0,this.turboFilter=this.ctx.createBiquadFilter(),this.turboFilter.type="bandpass",this.turboFilter.frequency.setValueAtTime(2200,this.ctx.currentTime),this.turboFilter.Q.setValueAtTime(3,this.ctx.currentTime),this.turboGain=this.ctx.createGain(),this.turboGain.gain.setValueAtTime(.001,this.ctx.currentTime),this.turboNoise.connect(this.turboFilter),this.turboFilter.connect(this.turboGain),this.turboGain.connect(this.compressor),this.turboNoise.start())}static triggerBlowOffValve(){if(!this.ctx||!this.isTurbo||this.isElectric||!this.compressor)return;const e=this.ctx.currentTime,t=this.createNoiseBuffer();if(!t)return;const s=this.ctx.createBufferSource();s.buffer=t;const i=this.ctx.createBiquadFilter();i.type="bandpass",i.frequency.setValueAtTime(3e3,e),i.Q.setValueAtTime(2.5,e);const r=this.ctx.createGain();r.gain.setValueAtTime(.08,e),r.gain.exponentialRampToValueAtTime(1e-4,e+.28),s.connect(i),i.connect(r),r.connect(this.compressor),s.start(e),s.stop(e+.3)}static getPulsesPerRevolution(e){switch(e){case"4 en ligne":case"Flat-4":return 2;case"5 en ligne":return 2.5;case"6 en ligne":case"Flat-6":case"V6":return 3;case"V8":return 4;case"V10":return 5;case"V12":return 6;case"W16":return 8;case"Rotatif":return 3;default:return 3}}static setRpm(e){this.currentRpm=Math.max(0,Math.min(e,this.maxRpm)),this.isPlaying&&this.updateFrequency()}static updateFrequency(){if(!this.ctx||!this.osc1||!this.osc2||!this.osc3||!this.osc4||!this.exhaustFilter)return;const e=this.ctx.currentTime,t=this.currentRpm,s=Math.max(.01,t/this.maxRpm);if(this.isElectric){const a=180+t*.12;this.osc1.frequency.setTargetAtTime(a,e,.04),this.osc2.frequency.setTargetAtTime(a*2,e,.04),this.osc3.frequency.setTargetAtTime(a*.5,e,.04),this.osc4.frequency.setTargetAtTime(a*3,e,.04);const l=400+s*3200;this.exhaustFilter.frequency.setTargetAtTime(l,e,.04);return}const i=this.getPulsesPerRevolution(this.config),r=Math.max(22,t/60*i);this.config==="V12"?(this.osc1.frequency.setTargetAtTime(r,e,.035),this.osc2.frequency.setTargetAtTime(r*2,e,.035),this.osc3.frequency.setTargetAtTime(r*.5,e,.035),this.osc4.frequency.setTargetAtTime(r*3,e,.035)):this.config==="V10"?(this.osc1.frequency.setTargetAtTime(r,e,.035),this.osc2.frequency.setTargetAtTime(r*2,e,.035),this.osc3.frequency.setTargetAtTime(r*.5,e,.035),this.osc4.frequency.setTargetAtTime(r*2.5,e,.035)):this.config==="5 en ligne"?(this.osc1.frequency.setTargetAtTime(r,e,.035),this.osc2.frequency.setTargetAtTime(r*1.5,e,.035),this.osc3.frequency.setTargetAtTime(r*.5,e,.035),this.osc4.frequency.setTargetAtTime(r*2.5,e,.035),this.lfo&&this.lfo.frequency.setTargetAtTime(t/140,e,.04)):this.config==="Flat-6"?(this.osc1.frequency.setTargetAtTime(r,e,.035),this.osc2.frequency.setTargetAtTime(r*2,e,.035),this.osc3.frequency.setTargetAtTime(r*.5,e,.035),this.osc4.frequency.setTargetAtTime(r*3,e,.035)):(this.osc1.frequency.setTargetAtTime(r,e,.035),this.osc2.frequency.setTargetAtTime(r*2,e,.035),this.osc3.frequency.setTargetAtTime(r*.5,e,.035),this.osc4.frequency.setTargetAtTime(r*3,e,.035));const n=220+s*1600;if(this.exhaustFilter.frequency.setTargetAtTime(n,e,.04),this.isTurbo&&this.turboFilter&&this.turboGain){const a=1800+s*4200;this.turboFilter.frequency.setTargetAtTime(a,e,.05);const l=Math.pow(s,2)*.06;this.turboGain.gain.setTargetAtTime(l,e,.05)}}static revUp(e){if(!this.isPlaying)return;const t=Math.round(this.maxRpm*.94),s=this.idleRpm;let i=0;const r=setInterval(()=>{if(i+=.05,i<=.45){const n=s+(t-s)*Math.sin(i/.45*(Math.PI/2));this.setRpm(n),e==null||e(n)}else if(i<=.55){const n=t+(Math.random()-.5)*(this.maxRpm*.02);this.setRpm(n),e==null||e(n)}else if(i<=1){i===.6&&this.isTurbo&&this.triggerBlowOffValve();const n=(i-.55)/.45,a=t-(t-s)*Math.pow(n,1.6);this.setRpm(a),e==null||e(a)}else clearInterval(r),this.setRpm(s),e==null||e(s)},25)}static stop(){if(!(!this.isPlaying||!this.ctx||!this.masterGain))try{const e=this.ctx.currentTime;this.masterGain.gain.setValueAtTime(this.masterGain.gain.value,e),this.masterGain.gain.exponentialRampToValueAtTime(1e-4,e+.12),setTimeout(()=>{var t,s,i,r,n,a,l,p,u,o,b,y,w,T,q,S,A,C,F;try{(t=this.osc1)==null||t.stop(),(s=this.osc2)==null||s.stop(),(i=this.osc3)==null||i.stop(),(r=this.osc4)==null||r.stop(),(n=this.lfo)==null||n.stop(),(a=this.turboNoise)==null||a.stop(),(l=this.osc1)==null||l.disconnect(),(p=this.osc2)==null||p.disconnect(),(u=this.osc3)==null||u.disconnect(),(o=this.osc4)==null||o.disconnect(),(b=this.lfo)==null||b.disconnect(),(y=this.lfoGain)==null||y.disconnect(),(w=this.turboNoise)==null||w.disconnect(),(T=this.turboFilter)==null||T.disconnect(),(q=this.turboGain)==null||q.disconnect(),(S=this.waveShaper)==null||S.disconnect(),(A=this.exhaustFilter)==null||A.disconnect(),(C=this.compressor)==null||C.disconnect(),(F=this.masterGain)==null||F.disconnect()}catch{}this.isPlaying=!1,this.currentEngine=null},130)}catch{this.isPlaying=!1,this.currentEngine=null}}static getActiveStatus(){return this.isPlaying}static getCurrentEngine(){return this.currentEngine}}d(h,"ctx",null),d(h,"masterGain",null),d(h,"compressor",null),d(h,"osc1",null),d(h,"osc2",null),d(h,"osc3",null),d(h,"osc4",null),d(h,"lfo",null),d(h,"lfoGain",null),d(h,"turboNoise",null),d(h,"turboFilter",null),d(h,"turboGain",null),d(h,"exhaustFilter",null),d(h,"waveShaper",null),d(h,"isPlaying",!1),d(h,"currentEngine",null),d(h,"currentRpm",800),d(h,"idleRpm",800),d(h,"maxRpm",8500),d(h,"isElectric",!1),d(h,"isTurbo",!1),d(h,"config","V8");class z{static render(e){const t=document.createElement("article");t.className="engine-card anim-card-item",t.setAttribute("data-id",e.id);const s=c.state.compareEngineIds.includes(e.id);let i="badge-default";return e.configuration.includes("V8")?i="badge-v8":e.configuration.includes("V12")||e.configuration.includes("W16")?i="badge-v12":e.aspiration.includes("Turbo")?i="badge-turbo":e.configuration==="Électrique"?i="badge-electric":e.configuration==="Rotatif"&&(i="badge-rotary"),t.innerHTML=`
      <div class="card-header-img">
        <img 
          src="${f(e.imageUrl||"https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800")}" 
          alt="${f(e.name)}" 
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'"
        />
        <div class="card-overlay-badges">
          <span class="badge ${i}">${f(e.configuration)}</span>
          <span class="badge badge-default">${f(e.fuel)}</span>
        </div>
        <button 
          class="card-favorite-btn ${e.isFavorite?"is-favorite":""}" 
          title="${e.isFavorite?"Retirer des favoris":"Ajouter aux favoris"}"
          data-action="toggle-fav"
        >
          <span>${e.isFavorite?"❤️":"🤍"}</span>
        </button>
      </div>

      <div class="card-body">
        <div class="card-title-row">
          <h3>${f(e.name)}</h3>
        </div>
        <div class="card-brand">${f(e.manufacturer)} • ${e.yearStart}${e.yearEnd?`-${e.yearEnd}`:" - Présent"}</div>

        <div class="card-metrics-grid">
          <div class="metric-item">
            <span class="metric-label">Puissance</span>
            <span class="metric-val" style="color: var(--accent-primary);">${g(e.power)} <small style="font-size:0.7rem;">ch</small></span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Couple</span>
            <span class="metric-val">${g(e.torque)} <small style="font-size:0.7rem;">Nm</small></span>
          </div>
          <div class="metric-item">
            <span class="metric-label">${e.configuration==="Électrique"?"Régime max":"Cylindrée"}</span>
            <span class="metric-val">${e.configuration==="Électrique"?`${g(e.maxRpm)}`:`${g(e.displacement)} <small style="font-size:0.7rem;">cm³</small>`}</span>
          </div>
        </div>

        <p class="card-desc">${f(e.description)}</p>

        <div class="card-actions">
          <div class="card-actions-left">
            <button class="like-btn" data-action="like" title="Liker ce moteur">
              <span>🔥</span>
              <span>${e.likes||0}</span>
            </button>

            <button class="btn-icon" data-action="play-sound" title="Écouter le son du moteur (Web Audio)">
              <span>🔊</span>
            </button>
          </div>

          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <button 
              class="btn ${s?"btn-primary":"btn-secondary"}" 
              data-action="compare" 
              style="padding: 0.35rem 0.65rem; font-size: 0.78rem;"
              title="Comparer ce moteur"
            >
              <span>${s?"✓ Comparé":"+ Comparer"}</span>
            </button>

            <button class="btn-icon" data-action="edit" title="Modifier ce moteur">
              <span>✏️</span>
            </button>

            <button class="btn-icon" data-action="delete" title="Supprimer ce moteur" style="color: var(--accent-primary);">
              <span>🗑️</span>
            </button>
          </div>
        </div>
      </div>
    `,this.attachEvents(t,e),t}static attachEvents(e,t){e.addEventListener("click",p=>{const u=p.target;u.closest("button")||u.closest("[data-action]")||document.dispatchEvent(new CustomEvent("open-engine-detail",{detail:{engineId:t.id}}))});const s=e.querySelector('[data-action="toggle-fav"]');s&&s.addEventListener("click",p=>{p.stopPropagation(),c.toggleFavorite(t.id),v.show(t.isFavorite?`"${t.name}" retiré des favoris`:`"${t.name}" ajouté aux favoris !`,"info")});const i=e.querySelector('[data-action="like"]');i&&i.addEventListener("click",p=>{p.stopPropagation(),c.incrementLikes(t.id),i.classList.add("anim-heartbeat"),setTimeout(()=>i.classList.remove("anim-heartbeat"),400)});const r=e.querySelector('[data-action="play-sound"]');r&&r.addEventListener("click",p=>{if(p.stopPropagation(),h.getActiveStatus())h.stop(),v.show("Son moteur arrêté","info");else{h.start(t),h.revUp();const u=t.configuration==="Électrique"?"Whine électrique":"Rugissement";v.show(`${u} du ${t.name} (${t.configuration}) ! 🔊`,"info"),setTimeout(()=>{h.stop()},2600)}});const n=e.querySelector('[data-action="compare"]');n&&n.addEventListener("click",p=>{if(p.stopPropagation(),!c.toggleCompare(t.id))v.show("Vous pouvez comparer jusqu'à 3 moteurs simultanément.","error");else{const o=c.state.compareEngineIds.includes(t.id);v.show(o?`"${t.name}" ajouté au comparateur`:`"${t.name}" retiré`,"info")}});const a=e.querySelector('[data-action="edit"]');a&&a.addEventListener("click",p=>{p.stopPropagation(),document.dispatchEvent(new CustomEvent("open-engine-form",{detail:{mode:"edit",engineId:t.id}}))});const l=e.querySelector('[data-action="delete"]');l&&l.addEventListener("click",p=>{p.stopPropagation(),confirm(`Êtes-vous sûr de vouloir supprimer le moteur "${t.name}" ?`)&&(e.style.transition="all 0.3s ease",e.style.opacity="0",e.style.transform="scale(0.85) translateY(20px)",setTimeout(()=>{c.deleteEngine(t.id),v.show(`Moteur "${t.name}" supprimé.`,"error")},300))})}}class G{constructor(){d(this,"element");this.element=document.getElementById("engine-grid-container")||document.createElement("main"),c.subscribe(()=>this.render())}render(){if(P(this.element),this.element.className="engines-container",c.state.isLoading){this.element.innerHTML=`
        <div style="text-align: center; padding: 5rem 0; color: var(--text-secondary);">
          <div style="font-size: 2.5rem; animation: spin 1.2s linear infinite; display: inline-block;">⚙️</div>
          <p style="margin-top: 1rem; font-weight: 600;">Chargement des moteurs via Fetch API...</p>
        </div>
      `;return}const e=c.getFilteredEngines();if(e.length===0){this.element.innerHTML=`
        <div style="text-align: center; padding: 4rem 1.5rem; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-lg); max-width: 600px; margin: 2rem auto;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem; color: var(--text-primary);">Aucun moteur trouvé</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.9rem;">
            Aucun moteur ne correspond à vos critères de recherche ou de filtre actuels.
          </p>
          <div style="display: flex; justify-content: center; gap: 0.75rem;">
            <button class="btn btn-secondary" id="empty-reset-filters">Réinitialiser les filtres</button>
            <button class="btn btn-primary" id="empty-add-engine">Créer un nouveau moteur</button>
          </div>
        </div>
      `;const s=this.element.querySelector("#empty-reset-filters");s&&s.addEventListener("click",()=>{c.resetFilters();const r=document.getElementById("global-search-input");r&&(r.value="")});const i=this.element.querySelector("#empty-add-engine");i&&i.addEventListener("click",()=>{document.dispatchEvent(new CustomEvent("open-engine-form",{detail:{mode:"create"}}))});return}const t=document.createElement("div");t.className="engines-grid",e.forEach((s,i)=>{const r=z.render(s);r.style.animationDelay=`${Math.min(i*40,400)}ms`,t.appendChild(r)}),this.element.appendChild(t)}}class O{static validate(e){const t={};!e.name||e.name.trim().length===0?t.name="Le nom du moteur est requis.":e.name.trim().length<2?t.name="Le nom doit comporter au moins 2 caractères.":e.name.trim().length>60&&(t.name="Le nom ne peut pas dépasser 60 caractères."),(!e.manufacturer||e.manufacturer.trim().length===0)&&(t.manufacturer="Le constructeur / marque est requis."),e.configuration||(t.configuration="Veuillez sélectionner une architecture de cylindres."),e.fuel||(t.fuel="Veuillez sélectionner le type de carburant."),e.aspiration||(t.aspiration="Veuillez sélectionner le type d'alimentation."),e.power===void 0||isNaN(e.power)?t.power="La puissance en chevaux (ch) est requise.":e.power<=0?t.power="La puissance doit être supérieure à 0 ch.":e.power>5e3&&(t.power="La puissance ne peut pas dépasser 5 000 ch."),e.torque===void 0||isNaN(e.torque)?t.torque="Le couple en Nm est requis.":e.torque<=0?t.torque="Le couple doit être supérieur à 0 Nm.":e.torque>6e3&&(t.torque="Le couple ne peut pas dépasser 6 000 Nm."),e.maxRpm===void 0||isNaN(e.maxRpm)?t.maxRpm="Le régime moteur max (RPM) est requis.":e.maxRpm<2e3?t.maxRpm="Le régime max doit être au moins de 2 000 tr/min.":e.maxRpm>25e3&&(t.maxRpm="Le régime max ne peut pas dépasser 25 000 tr/min."),e.configuration!=="Électrique"&&(e.displacement===void 0||isNaN(e.displacement)?t.displacement="La cylindrée en cm³ est requise.":e.displacement<200?t.displacement="La cylindrée minimale est de 200 cm³.":e.displacement>2e4&&(t.displacement="La cylindrée ne peut pas dépasser 20 000 cm³."));const s=new Date().getFullYear();return e.yearStart===void 0||isNaN(e.yearStart)?t.yearStart="L'année de lancement est requise.":(e.yearStart<1886||e.yearStart>s+2)&&(t.yearStart=`L'année doit être comprise entre 1886 et ${s+2}.`),e.yearEnd!==null&&e.yearEnd!==void 0&&!isNaN(e.yearEnd)&&e.yearStart&&e.yearEnd<e.yearStart&&(t.yearEnd="L'année de fin ne peut pas être antérieure à l'année de début."),!e.description||e.description.trim().length===0?t.description="Une brève description technique est requise.":e.description.trim().length<10&&(t.description="La description doit comporter au moins 10 caractères."),t}}class D{constructor(){d(this,"backdrop");d(this,"currentMode","create");d(this,"currentEngineId",null);this.backdrop=document.getElementById("engine-form-modal")||document.createElement("div"),this.initEventListeners()}initEventListeners(){document.addEventListener("open-engine-form",e=>{const t=e.detail||{};this.open(t.mode||"create",t.engineId||null)})}open(e,t=null){this.currentMode=e,this.currentEngineId=t;let s={name:"",manufacturer:"",configuration:"V8",displacement:4e3,power:500,torque:550,maxRpm:7500,aspiration:"Bi-Turbo",fuel:"Essence",yearStart:new Date().getFullYear(),yearEnd:null,vehicles:[],soundPitch:500,description:"",imageUrl:"https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800"};if(e==="edit"&&t){const i=c.state.engines.find(r=>r.id===t);i&&(s={...i})}this.render(s),this.backdrop.classList.add("open"),document.body.style.overflow="hidden"}close(){this.backdrop.classList.remove("open"),document.body.style.overflow=""}render(e){const t=this.currentMode==="edit";this.backdrop.className="modal-backdrop";const s=["4 en ligne","5 en ligne","6 en ligne","V6","V8","V10","V12","W16","Flat-4","Flat-6","Rotatif","Électrique","Autre"],i=["Essence","Diesel","Hybride","Électrique","Hydrogène","E85"],r=["Atmosphérique","Turbo","Bi-Turbo","Quad-Turbo","Compresseur","N/A"];this.backdrop.innerHTML=`
      <div class="modal-content" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>${t?"Modifier le moteur":"Ajouter un nouveau moteur"}</h2>
          <button class="btn-icon" id="btn-close-modal" aria-label="Fermer">✕</button>
        </div>

        <form id="engine-form" class="modal-body" novalidate>
          <div class="form-grid">
            <!-- Nom du moteur -->
            <div class="form-group">
              <label class="form-label" for="input-name">Nom du moteur <span class="required">*</span></label>
              <input 
                type="text" 
                id="input-name" 
                name="name" 
                class="form-input" 
                placeholder="Ex: 2JZ-GTE, S85B50..." 
                value="${f(e.name||"")}" 
                required
              />
              <span class="field-error" id="error-name"></span>
            </div>

            <!-- Constructeur -->
            <div class="form-group">
              <label class="form-label" for="input-manufacturer">Constructeur / Marque <span class="required">*</span></label>
              <input 
                type="text" 
                id="input-manufacturer" 
                name="manufacturer" 
                class="form-input" 
                placeholder="Ex: Ferrari, Porsche, Toyota..." 
                value="${f(e.manufacturer||"")}" 
                required
              />
              <span class="field-error" id="error-manufacturer"></span>
            </div>

            <!-- Configuration -->
            <div class="form-group">
              <label class="form-label" for="input-config">Architecture / Configuration <span class="required">*</span></label>
              <select id="input-config" name="configuration" class="form-select">
                ${s.map(n=>`<option value="${n}" ${e.configuration===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>

            <!-- Carburant -->
            <div class="form-group">
              <label class="form-label" for="input-fuel">Carburant <span class="required">*</span></label>
              <select id="input-fuel" name="fuel" class="form-select">
                ${i.map(n=>`<option value="${n}" ${e.fuel===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>

            <!-- Aspiration -->
            <div class="form-group">
              <label class="form-label" for="input-aspiration">Alimentation / Suralimentation <span class="required">*</span></label>
              <select id="input-aspiration" name="aspiration" class="form-select">
                ${r.map(n=>`<option value="${n}" ${e.aspiration===n?"selected":""}>${n}</option>`).join("")}
              </select>
            </div>

            <!-- Cylindrée -->
            <div class="form-group">
              <label class="form-label" for="input-displacement">Cylindrée (cm³) <span class="required">*</span></label>
              <input 
                type="number" 
                id="input-displacement" 
                name="displacement" 
                class="form-input" 
                placeholder="Ex: 3996" 
                value="${e.displacement??0}"
                min="0"
                step="1"
              />
              <span class="field-error" id="error-displacement"></span>
            </div>

            <!-- Puissance -->
            <div class="form-group">
              <label class="form-label" for="input-power">Puissance (ch) <span class="required">*</span></label>
              <input 
                type="number" 
                id="input-power" 
                name="power" 
                class="form-input" 
                placeholder="Ex: 525" 
                value="${e.power||""}"
                min="1"
                required
              />
              <span class="field-error" id="error-power"></span>
            </div>

            <!-- Couple -->
            <div class="form-group">
              <label class="form-label" for="input-torque">Couple maximal (Nm) <span class="required">*</span></label>
              <input 
                type="number" 
                id="input-torque" 
                name="torque" 
                class="form-input" 
                placeholder="Ex: 465" 
                value="${e.torque||""}"
                min="1"
                required
              />
              <span class="field-error" id="error-torque"></span>
            </div>

            <!-- Régime Max (RPM) -->
            <div class="form-group">
              <label class="form-label" for="input-maxrpm">Régime Max (tr/min) <span class="required">*</span></label>
              <input 
                type="number" 
                id="input-maxrpm" 
                name="maxRpm" 
                class="form-input" 
                placeholder="Ex: 9000" 
                value="${e.maxRpm||""}"
                min="2000"
                max="25000"
                required
              />
              <span class="field-error" id="error-maxRpm"></span>
            </div>

            <!-- Années de production -->
            <div class="form-group">
              <label class="form-label" for="input-yearstart">Année de lancement <span class="required">*</span></label>
              <input 
                type="number" 
                id="input-yearstart" 
                name="yearStart" 
                class="form-input" 
                value="${e.yearStart||new Date().getFullYear()}"
                min="1886"
                required
              />
              <span class="field-error" id="error-yearStart"></span>
            </div>

            <div class="form-group">
              <label class="form-label" for="input-yearend">Année de fin (Laisser vide si en cours)</label>
              <input 
                type="number" 
                id="input-yearend" 
                name="yearEnd" 
                class="form-input" 
                placeholder="En cours..." 
                value="${e.yearEnd||""}"
                min="1886"
              />
              <span class="field-error" id="error-yearEnd"></span>
            </div>

            <!-- Véhicules emblématiques -->
            <div class="form-group-full form-group">
              <label class="form-label" for="input-vehicles">Véhicules équipés (séparés par des virgules)</label>
              <input 
                type="text" 
                id="input-vehicles" 
                name="vehicles" 
                class="form-input" 
                placeholder="Ex: Porsche 911 GT3, 718 Cayman GT4 RS..." 
                value="${f((e.vehicles||[]).join(", "))}" 
              />
            </div>

            <!-- URL Image -->
            <div class="form-group-full form-group">
              <label class="form-label" for="input-image">URL de l'image / illustration</label>
              <input 
                type="url" 
                id="input-image" 
                name="imageUrl" 
                class="form-input" 
                placeholder="https://..." 
                value="${f(e.imageUrl||"")}" 
              />
            </div>

            <!-- Description -->
            <div class="form-group-full form-group">
              <label class="form-label" for="input-desc">Description & Spécificités techniques <span class="required">*</span></label>
              <textarea 
                id="input-desc" 
                name="description" 
                class="form-textarea" 
                rows="3" 
                placeholder="Décrivez l'histoire, la conception et les sensations de ce moteur..." 
                required
              >${f(e.description||"")}</textarea>
              <span class="field-error" id="error-description"></span>
            </div>
          </div>
        </form>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="btn-cancel-form">Annuler</button>
          <button type="button" class="btn btn-primary" id="btn-submit-form">
            <span>💾</span>
            <span>${t?"Enregistrer les modifications":"Créer le moteur"}</span>
          </button>
        </div>
      </div>
    `,this.attachFormEvents()}attachFormEvents(){var t,s,i;(t=this.backdrop.querySelector("#btn-close-modal"))==null||t.addEventListener("click",()=>this.close()),(s=this.backdrop.querySelector("#btn-cancel-form"))==null||s.addEventListener("click",()=>this.close()),this.backdrop.addEventListener("click",r=>{r.target===this.backdrop&&this.close()}),(i=this.backdrop.querySelector("#btn-submit-form"))==null||i.addEventListener("click",()=>{this.handleSubmit()}),this.backdrop.querySelectorAll("input, select, textarea").forEach(r=>{r.addEventListener("input",()=>{const n=r.name,a=this.backdrop.querySelector(`#error-${n}`);a&&(a.textContent="",r.classList.remove("has-error"))})})}handleSubmit(){const e=this.backdrop.querySelector("#engine-form");if(!e)return;const t=new FormData(e),s=(t.get("vehicles")||"").trim(),i=s?s.split(",").map(a=>a.trim()).filter(Boolean):[],r={name:(t.get("name")||"").trim(),manufacturer:(t.get("manufacturer")||"").trim(),configuration:t.get("configuration"),displacement:Number(t.get("displacement")),power:Number(t.get("power")),torque:Number(t.get("torque")),maxRpm:Number(t.get("maxRpm")),aspiration:t.get("aspiration"),fuel:t.get("fuel"),yearStart:Number(t.get("yearStart")),yearEnd:t.get("yearEnd")?Number(t.get("yearEnd")):null,vehicles:i,description:(t.get("description")||"").trim(),imageUrl:(t.get("imageUrl")||"").trim()||"https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",soundPitch:500},n=O.validate(r);if(this.backdrop.querySelectorAll(".field-error").forEach(a=>a.textContent=""),this.backdrop.querySelectorAll(".has-error").forEach(a=>a.classList.remove("has-error")),Object.keys(n).length>0){for(const[a,l]of Object.entries(n)){const p=this.backdrop.querySelector(`#error-${a}`),u=this.backdrop.querySelector(`[name="${a}"]`);p&&(p.textContent=l),u&&u.classList.add("has-error")}v.show("Veuillez corriger les erreurs dans le formulaire.","error");return}this.currentMode==="edit"&&this.currentEngineId?(c.updateEngine(this.currentEngineId,r),v.show(`Moteur "${r.name}" mis à jour avec succès !`,"success")):(c.addEngine(r),v.show(`Moteur "${r.name}" ajouté au catalogue !`,"success")),this.close()}}class j{constructor(){d(this,"backdrop");d(this,"currentEngine",null);d(this,"isAudioRunning",!1);this.backdrop=document.getElementById("engine-detail-modal")||document.createElement("div"),this.initEventListeners()}initEventListeners(){document.addEventListener("open-engine-detail",e=>{var s;const t=(s=e.detail)==null?void 0:s.engineId;if(t){const i=c.state.engines.find(r=>r.id===t);i&&this.open(i)}})}open(e){this.currentEngine=e,this.render(),this.backdrop.classList.add("open"),document.body.style.overflow="hidden"}close(){this.isAudioRunning&&(h.stop(),this.isAudioRunning=!1),this.backdrop.classList.remove("open"),document.body.style.overflow=""}render(){if(!this.currentEngine)return;const e=this.currentEngine;this.backdrop.className="modal-backdrop";const t=e.displacement>0?(e.power/(e.displacement/1e3)).toFixed(1):"N/A",s=Math.round(e.maxRpm*.12);this.backdrop.innerHTML=`
      <div class="modal-content" style="max-width: 800px;" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div>
            <h2>${f(e.name)}</h2>
            <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${f(e.manufacturer)} • ${e.yearStart}${e.yearEnd?`-${e.yearEnd}`:" - Présent"}</p>
          </div>
          <button class="btn-icon" id="btn-close-detail" aria-label="Fermer">✕</button>
        </div>

        <div class="modal-body">
          <div style="height: 240px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1.5rem; background: #000; position: relative;">
            <img 
              src="${f(e.imageUrl)}" 
              alt="${f(e.name)}" 
              style="width: 100%; height: 100%; object-fit: cover;"
              onerror="this.src='https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800'"
            />
            <div style="position: absolute; bottom: 1rem; left: 1rem; display: flex; gap: 0.5rem;">
              <span class="badge badge-v8">${f(e.configuration)}</span>
              <span class="badge badge-turbo">${f(e.aspiration)}</span>
              <span class="badge badge-default">${f(e.fuel)}</span>
            </div>
          </div>

          <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
            ${f(e.description)}
          </p>

          <!-- Tachomètre & Simulateur Sonore Web Audio -->
          <div class="tachometer-widget">
            <h4 style="color: var(--text-primary); font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">
              Simulateur de Régime & Sonorité Moteur (Web Audio API)
            </h4>
            <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0;">
              Activez le démarreur pour entendre le moteur et jouez avec l'accélérateur !
            </p>

            <div class="tacho-dial">
              <div class="tacho-dial-inner">
                <div class="rpm-number" id="tacho-rpm-display">${s}</div>
                <div class="rpm-unit">TR / MIN</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">RUPTEUR: ${g(e.maxRpm)}</div>
              </div>
            </div>

            <div class="tacho-controls">
              <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted);">
                <span>Ralenti</span>
                <span>Plein régime (Rupteur)</span>
              </div>
              <input 
                type="range" 
                class="rpm-slider" 
                id="rpm-range-slider" 
                min="${s}" 
                max="${e.maxRpm}" 
                value="${s}"
                disabled
              />

              <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 0.5rem;">
                <button class="btn btn-primary" id="btn-audio-toggle">
                  <span>🔑</span>
                  <span id="btn-audio-text">Démarrer le moteur</span>
                </button>

                <button class="btn btn-secondary" id="btn-audio-rev" disabled>
                  <span>🔥</span>
                  <span>Coup d'accélérateur !</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Spécifications Détaillées -->
          <h4 style="color: var(--text-primary); font-size: 1.05rem; font-weight: 700; margin: 1.5rem 0 0.75rem;">
            Fiche Technique Complète
          </h4>
          <div class="card-metrics-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));">
            <div class="metric-item">
              <span class="metric-label">Puissance</span>
              <span class="metric-val" style="color: var(--accent-primary);">${g(e.power)} ch</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Couple</span>
              <span class="metric-val">${g(e.torque)} Nm</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Cylindrée</span>
              <span class="metric-val">${e.displacement>0?`${g(e.displacement)} cm³`:"N/A"}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Rendement</span>
              <span class="metric-val">${t} ${e.displacement>0?"ch/L":""}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Régime Max</span>
              <span class="metric-val">${g(e.maxRpm)} tr/min</span>
            </div>
          </div>

          <!-- Véhicules équipés -->
          ${e.vehicles&&e.vehicles.length>0?`
            <h4 style="color: var(--text-primary); font-size: 1.05rem; font-weight: 700; margin: 1.5rem 0 0.75rem;">
              Véhicules Mythiques Équipés
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${e.vehicles.map(i=>`<span class="badge badge-default" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">🚗 ${f(i)}</span>`).join("")}
            </div>
          `:""}
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-close-detail-footer">Fermer</button>
          <button class="btn btn-primary" id="btn-edit-from-detail">
            <span>✏️ Modifier</span>
          </button>
        </div>
      </div>
    `,this.attachEvents()}attachEvents(){var l,p,u;if(!this.currentEngine)return;const e=this.currentEngine,t=Math.round(e.maxRpm*.12);(l=this.backdrop.querySelector("#btn-close-detail"))==null||l.addEventListener("click",()=>this.close()),(p=this.backdrop.querySelector("#btn-close-detail-footer"))==null||p.addEventListener("click",()=>this.close()),this.backdrop.addEventListener("click",o=>{o.target===this.backdrop&&this.close()}),(u=this.backdrop.querySelector("#btn-edit-from-detail"))==null||u.addEventListener("click",()=>{const o=e.id;this.close(),document.dispatchEvent(new CustomEvent("open-engine-form",{detail:{mode:"edit",engineId:o}}))});const s=this.backdrop.querySelector("#btn-audio-toggle"),i=this.backdrop.querySelector("#btn-audio-text"),r=this.backdrop.querySelector("#btn-audio-rev"),n=this.backdrop.querySelector("#rpm-range-slider"),a=this.backdrop.querySelector("#tacho-rpm-display");s&&n&&r&&a&&(s.addEventListener("click",()=>{if(this.isAudioRunning)h.stop(),this.isAudioRunning=!1,i&&(i.textContent="Démarrer le moteur"),n.disabled=!0,r.disabled=!0,a.textContent=`${t}`,n.value=`${t}`,v.show("Contact coupé.","info");else{h.start(e),this.isAudioRunning=!0,i&&(i.textContent="Couper le contact"),n.disabled=!1,r.disabled=!1,a.textContent=`${t}`;const b=e.configuration==="Électrique"||e.fuel==="Électrique"?`Système électrique ${e.name} sous tension ! ⚡🔊`:`Moteur ${e.name} (${e.configuration}) démarré au ralenti ! 🔊`;v.show(b,"success")}}),n.addEventListener("input",()=>{const o=Number(n.value);a.textContent=`${g(o)}`,h.setRpm(o)}),r.addEventListener("click",()=>{h.revUp(o=>{a.textContent=`${g(Math.round(o))}`,n.value=`${Math.round(o)}`})}))}}class H{constructor(){d(this,"drawerElement");d(this,"modalElement");this.drawerElement=document.getElementById("compare-drawer")||document.createElement("aside"),this.modalElement=document.getElementById("compare-modal")||document.createElement("div"),c.subscribe((e,t)=>{(!t||t==="compareEngineIds"||t==="engines")&&this.renderDrawer()})}renderDrawer(){const e=c.state.compareEngineIds,t=c.state.engines.filter(s=>e.includes(s.id));this.drawerElement.className=`compare-drawer ${t.length>0?"open":""}`,this.drawerElement.innerHTML=`
      <div class="compare-inner">
        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">
            ⚖️ Comparateur (${t.length}/3) :
          </div>

          <div class="compare-chips">
            ${t.map(s=>`
              <div class="compare-chip">
                <span>${f(s.name)}</span>
                <span class="compare-chip-remove" data-remove="${s.id}" title="Retirer">✕</span>
              </div>
            `).join("")}
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <button class="btn btn-secondary" id="btn-clear-compare" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
            Tout effacer
          </button>

          <button class="btn btn-primary" id="btn-launch-compare" ${t.length<2?"disabled":""}>
            <span>Comparer côte à côte (${t.length})</span>
          </button>
        </div>
      </div>
    `,this.attachDrawerEvents()}attachDrawerEvents(){var e,t;this.drawerElement.querySelectorAll("[data-remove]").forEach(s=>{s.addEventListener("click",()=>{const i=s.getAttribute("data-remove");i&&c.toggleCompare(i)})}),(e=this.drawerElement.querySelector("#btn-clear-compare"))==null||e.addEventListener("click",()=>{c.clearCompare(),v.show("Comparateur réinitialisé","info")}),(t=this.drawerElement.querySelector("#btn-launch-compare"))==null||t.addEventListener("click",()=>{this.openCompareModal()})}openCompareModal(){var i,r;const e=c.state.compareEngineIds,t=c.state.engines.filter(n=>e.includes(n.id));if(t.length<2)return;this.modalElement.className="modal-backdrop open",this.modalElement.innerHTML=`
      <div class="modal-content" style="max-width: 960px;" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2>⚖️ Comparatif Technique Face-à-Face</h2>
          <button class="btn-icon" id="btn-close-compare-modal">✕</button>
        </div>

        <div class="modal-body" style="overflow-x: auto;">
          <div style="display: grid; grid-template-columns: repeat(${t.length}, 1fr); gap: 1.5rem; min-width: 600px;">
            ${t.map(n=>`
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column;">
                <div style="height: 140px; border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 1rem; background: #000;">
                  <img src="${f(n.imageUrl)}" alt="${f(n.name)}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">${f(n.name)}</h3>
                <div style="font-size: 0.8rem; color: var(--accent-secondary); font-weight: 600; margin-bottom: 1rem;">${f(n.manufacturer)}</div>

                <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.88rem;">
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Architecture</div>
                    <strong>${f(n.configuration)}</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Puissance</div>
                    <strong style="color: var(--accent-primary); font-size: 1.1rem;">${g(n.power)} ch</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Couple</div>
                    <strong>${g(n.torque)} Nm</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Cylindrée</div>
                    <strong>${n.displacement>0?`${g(n.displacement)} cm³`:"N/A"}</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Régime Max</div>
                    <strong>${g(n.maxRpm)} tr/min</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Alimentation</div>
                    <strong>${f(n.aspiration)}</strong>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase;">Carburant</div>
                    <strong>${f(n.fuel)}</strong>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-close-compare-footer">Fermer</button>
        </div>
      </div>
    `;const s=()=>{this.modalElement.classList.remove("open")};(i=this.modalElement.querySelector("#btn-close-compare-modal"))==null||i.addEventListener("click",s),(r=this.modalElement.querySelector("#btn-close-compare-footer"))==null||r.addEventListener("click",s),this.modalElement.addEventListener("click",n=>{n.target===this.modalElement&&s()})}}class U{constructor(){d(this,"formModal");d(this,"detailModal")}async init(){console.log("🏎️ Initialisation de ApexEngine (Vanilla TS + Proxy Store)..."),new I,new B,new V,new G,this.formModal=new D,this.detailModal=new j,new H,this.initKeyboardShortcuts();try{const e=await L.loadInitialEngines();c.setEngines(e),v.show(`${e.length} moteurs chargés avec succès !`,"success")}catch(e){console.error("Erreur lors du démarrage :",e),c.state.isLoading=!1,c.state.errorMessage="Impossible de charger la base de données.",v.show("Erreur de chargement des données.","error")}}initKeyboardShortcuts(){window.addEventListener("keydown",e=>{const t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT")){e.key==="Escape"&&t.blur();return}if(e.key==="/"){e.preventDefault();const s=document.getElementById("global-search-input");s==null||s.focus(),s==null||s.select()}(e.key==="n"||e.key==="N")&&(e.preventDefault(),this.formModal.open("create")),e.key==="Escape"&&(this.formModal.close(),this.detailModal.close())})}}document.addEventListener("DOMContentLoaded",()=>{new U().init()});
