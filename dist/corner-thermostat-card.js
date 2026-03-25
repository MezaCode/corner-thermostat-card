class CornerThermostatCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) throw new Error("Entity required");

    this.config = {
      cool_color: "#5ab0ff",
      heat_color: "#ff6a5a",
      fan_color: "#7dffb3",
      power_color: "#ffffff",
      ...config
    };
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
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .temp-container {
            text-align: center;
            z-index: 2;
          }

          .current {
            font-size: 42px;
            font-weight: 600;
          }

          .target {
            font-size: 20px;
            opacity: 0.7;
          }

          /* CONTROLS (FIXED POSITION + SIZE) */
          .controls {
            position: absolute;
            top: 50%;
            width: 100%;
            display: flex;
            justify-content: center;
            gap: 60px;
            transform: translateY(-50%);
            z-index: 2;
          }

          button {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            background: rgba(255,255,255,0.08);
            font-size: 18px;
            color: white;
          }

          /* CORNER ICONS */
          .corner {
            position: absolute;
            z-index: 1;
          }

          .circle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 110px;
            height: 110px;
            border-radius: 50%;
            transform: translate(-35%, -35%);
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
          }

          /* POSITIONING */
          .power { top: 0; left: 0; }
          .cool { top: 0; right: 0; }
          .heat { bottom: 0; left: 0; }
          .fan { bottom: 0; right: 0; }

          .power ha-icon { top: 16px; left: 16px; }
          .cool ha-icon { top: 16px; right: 16px; }
          .heat ha-icon { bottom: 16px; left: 16px; }
          .fan ha-icon { bottom: 16px; right: 16px; }

          /* FILLED COLORS */
          .cool .circle { background: ${this.config.cool_color}; }
          .heat .circle { background: ${this.config.heat_color}; }
          .fan .circle { background: ${this.config.fan_color}; }
          .power .circle { background: ${this.config.power_color}; }
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
            <div class="target">${target}°</div>
          </div>

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
    this._render();
  }

  _render() {
    if (!this._hass) return;

    const config = this.config || {};

    const entities = Object.keys(this._hass.states)
      .filter(e => e.startsWith("climate."));

    this.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px;">
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
      </div>
    `;

    this.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("change", () => this._update());
    });
  }

  _update() {
    const config = {
      entity: this.querySelector("#entity").value,
      cool_color: this.querySelector("#cool").value,
      heat_color: this.querySelector("#heat").value,
      fan_color: this.querySelector("#fan").value,
      power_color: this.querySelector("#power").value
    };

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