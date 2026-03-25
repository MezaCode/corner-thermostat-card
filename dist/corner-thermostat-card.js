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
    if (!this._hass) return;

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
          }

          .current {
            font-size: 42px;
            font-weight: 600;
          }

          .target {
            font-size: 20px;
            opacity: 0.7;
          }

          .controls {
            position: absolute;
            top: 50%;
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 0 25%;
            transform: translateY(-50%);
          }

          button {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: none;
            background: rgba(255,255,255,0.08);
            font-size: 22px;
            color: white;
          }

          .corner {
            position: absolute;
          }

          .corner ha-icon {
            width: 26px;
            height: 26px;
          }

          .circle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 50%;
          }

          .power { top: 16px; left: 16px; }
          .cool { top: 16px; right: 16px; }
          .heat { bottom: 16px; left: 16px; }
          .fan { bottom: 16px; right: 16px; }

          .active.cool .circle { border: 2px solid ${this.config.cool_color}; }
          .active.heat .circle { border: 2px solid ${this.config.heat_color}; }
          .active.fan .circle { border: 2px solid ${this.config.fan_color}; }
          .active.power .circle { border: 2px solid ${this.config.power_color}; }
        </style>

        <div class="wrap">

          <div class="corner power ${hvac === 'off' ? 'active' : ''}" id="power">
            <div class="circle"><ha-icon icon="mdi:power"></ha-icon></div>
          </div>

          <div class="corner cool ${hvac === 'cool' ? 'active' : ''}" id="cool">
            <div class="circle"><ha-icon icon="mdi:snowflake"></ha-icon></div>
          </div>

          <div class="corner heat ${hvac === 'heat' ? 'active' : ''}" id="heat">
            <div class="circle"><ha-icon icon="mdi:fire"></ha-icon></div>
          </div>

          <div class="corner fan ${fan === 'on' ? 'active' : ''}" id="fan">
            <div class="circle"><ha-icon icon="mdi:fan"></ha-icon></div>
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
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass) return;

    const entities = Object.keys(this._hass.states)
      .filter(e => e.startsWith("climate."));

    this.innerHTML = `
      <div>
        <label>Entity</label>
        <select id="entity">
          ${entities.map(e => `<option value="${e}" ${this.config.entity===e?"selected":""}>${e}</option>`).join("")}
        </select>

        <label>Cool Color</label>
        <input type="color" id="cool" value="${this.config.cool_color || "#5ab0ff"}">

        <label>Heat Color</label>
        <input type="color" id="heat" value="${this.config.heat_color || "#ff6a5a"}">

        <label>Fan Color</label>
        <input type="color" id="fan" value="${this.config.fan_color || "#7dffb3"}">

        <label>Power Color</label>
        <input type="color" id="power" value="${this.config.power_color || "#ffffff"}">
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