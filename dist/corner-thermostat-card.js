class CornerThermostatCard extends HTMLElement {
  setConfig(config) {
    this.config = {
      entity: config.entity,
      cool_color: "#5ab0ff",
      heat_color: "#ff6a5a",
      fan_color: "#7dffb3",
      power_color: "#ffffff",
      ...config
    };

    if (!this.config.entity) throw new Error("Entity required");
  }

  static getConfigElement() {
    return document.createElement("corner-thermostat-editor");
  }

  static getStubConfig(hass) {
    const entity = Object.keys(hass.states).find(e => e.startsWith("climate."));
    return { entity };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this.config) return;

    const stateObj = this._hass.states[this.config.entity];
    if (!stateObj) return;

    const current = stateObj.attributes.current_temperature ?? "--";
    const target = stateObj.attributes.temperature ?? "--";
    const hvac = stateObj.state;
    const fan = stateObj.attributes.fan_mode;

    this.innerHTML = `
      <ha-card>
        <style>
          ha-card {
            height: 100%;
            border-radius: 18px;
            overflow: hidden;
          }

          .wrap {
            position: relative;
            width: 100%;
            height: 100%;
            color: white;
          }

          /* TEMPS */
          .temp-container {
            position: absolute;
            top: 42%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 2;
          }

          .current {
            position: absolute;
            top: 30%;           
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 42px;
            font-weight: 600;
          }

          /* 🔥 FIX #2 — ONLY target temp moved down */
          .target {
            position: absolute;
            top: 75%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 20px;
            opacity: 0.7;
          }

          /* CONTROLS */
          .controls {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            gap: 50px;
            z-index: 2;
          }

          button {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: none;
            background: rgba(255,255,255,0.08);
            font-size: 18px;
            color: white;
          }

          /* 🔥 FIX #1 — unified corner system (matches power for ALL) */
          .corner {
            position: absolute;
            width: 0;
            height: 0;
          }

          .corner .circle {
            position: absolute;
            width: 140px;
            height: 140px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            opacity: 0;
            transition: 0.3s;
          }

          .corner.active .circle {
            opacity: 0.25;
          }

          .corner ha-icon {
            position: absolute;
            width: 26px;
            height: 26px;
            transform: translate(-50%, -50%);
          }

          /* IDENTICAL POSITION LOGIC FOR ALL CORNERS */
          .power { top: 18px; left: 18px; }
          .cool  { top: 18px; right: 18px; }
          .heat  { bottom: 18px; left: 18px; }
          .fan   { bottom: 18px; right: 18px; }

          /* ICON ANCHORING */
          .power ha-icon { top: 0; left: 0; }
          .cool  ha-icon { top: 0; right: -18; }
          .heat  ha-icon { bottom: -18; left: 0; }
          .fan   ha-icon { bottom: -18; right: -18; }

          /* COLORS */
          .power .circle { background: ${this.config.power_color}; }
          .cool  .circle { background: ${this.config.cool_color}; }
          .heat  .circle { background: ${this.config.heat_color}; }
          .fan   .circle { background: ${this.config.fan_color}; }
        </style>

        <div class="wrap">

          <div class="corner power ${hvac === 'off' ? 'active' : ''}" id="power">
            <div class="circle"></div>
            <ha-icon icon="mdi:power"></ha-icon>
          </div>

          <div class="corner cool ${hvac === 'cool' ? 'active' : ''}" id="cool">
            <div class="circle"></div>
            <ha-icon icon="mdi:snowflake"></ha-icon>
          </div>

          <div class="corner heat ${hvac === 'heat' ? 'active' : ''}" id="heat">
            <div class="circle"></div>
            <ha-icon icon="mdi:fire"></ha-icon>
          </div>

          <div class="corner fan ${fan === 'on' ? 'active' : ''}" id="fan">
            <div class="circle"></div>
            <ha-icon icon="mdi:fan"></ha-icon>
          </div>

          <div class="temp-container">
            <div class="current">${current}°</div>
          </div>

          <div class="target">${target}°</div>

          <div class="controls">
            <button id="minus">−</button>
            <button id="plus">+</button>
          </div>

        </div>
      </ha-card>
    `;

    this.querySelector("#plus").onclick = () => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this.config.entity,
        temperature: target + 1
      });
    };

    this.querySelector("#minus").onclick = () => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this.config.entity,
        temperature: target - 1
      });
    };

    this.querySelector("#cool").onclick = () => {
      this._hass.callService("climate", "set_hvac_mode", {
        entity_id: this.config.entity,
        hvac_mode: "cool"
      });
    };

    this.querySelector("#heat").onclick = () => {
      this._hass.callService("climate", "set_hvac_mode", {
        entity_id: this.config.entity,
        hvac_mode: "heat"
      });
    };

    this.querySelector("#power").onclick = () => {
      this._hass.callService("climate", "set_hvac_mode", {
        entity_id: this.config.entity,
        hvac_mode: "off"
      });
    };

    this.querySelector("#fan").onclick = () => {
      this._hass.callService("climate", "set_fan_mode", {
        entity_id: this.config.entity,
        fan_mode: fan === "on" ? "auto" : "on"
      });
    };
  }
}

customElements.define("corner-thermostat-card", CornerThermostatCard);



class CornerThermostatEditor extends HTMLElement {
  setConfig(config) {
    this.config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.config) this.config = {};
    this._render();
  }

  _render() {
    if (!this._hass) return;

    const config = this.config || {};

    const entities = Object.keys(this._hass.states)
      .filter(e => e.startsWith("climate."));

    this.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; min-height:320px;">
        <label>Entity</label>
        <select id="entity">
          ${entities.map(e => `<option value="${e}" ${config.entity===e?"selected":""}>${e}</option>`).join("")}
        </select>

        <label>Cool Color</label>
        <input type="color" id="cool" value="${config.cool_color || "#5ab0ff"}">

        <label>Heat Color</label>
        <input type="color" id="heat" value="${config.heat_color || "#ff6a5a"}">

        <label>Fan Color</label>
        <input type="color" id="fan" value="${config.fan_color || "#7dffb3"}">

        <label>Power Color</label>
        <input type="color" id="power" value="${config.power_color || "#ffffff"}">

        <div style="height:200px; margin-top:10px;">
          <corner-thermostat-card id="preview"></corner-thermostat-card>
        </div>
      </div>
    `;

    const preview = this.querySelector("#preview");
    preview.setConfig({
      entity: config.entity || entities[0],
      ...config
    });
    preview.hass = this._hass;

    this.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("change", () => this._update());
    });
  }

  _update() {
    const config = {
      ...this.config,
      entity: this.querySelector("#entity").value,
      cool_color: this.querySelector("#cool").value,
      heat_color: this.querySelector("#heat").value,
      fan_color: this.querySelector("#fan").value,
      power_color: this.querySelector("#power").value
    };

    this.config = config;

    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define("corner-thermostat-editor", CornerThermostatEditor);


window.customCards = window.customCards || [];
window.customCards.push({
  type: "corner-thermostat-card",
  name: "Corner Thermostat",
  preview: true
});