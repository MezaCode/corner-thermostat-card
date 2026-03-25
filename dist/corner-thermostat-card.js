class CornerThermostatCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("Entity required");
    }

    this.config = {
      width: "100%",
      height: "100%",
      bg_color: "#1a1a1a",
      bg_opacity: 1,
      cool_color: "#5ab0ff",
      heat_color: "#ff6a5a",
      fan_color: "#7dffb3",
      power_color: "#ffffff",
      ...config
    };
  }

  static getConfigElement() {
    return document.createElement("corner-thermostat-card-editor");
  }

  static getStubConfig(hass) {
    const entity = Object.keys(hass.states).find(e => e.startsWith("climate."));
    return { entity: entity || "" };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this.config?.entity) return;

    const stateObj = this._hass.states[this.config.entity];
    if (!stateObj) return;

    const c = this.config;

    const currentTemp = stateObj.attributes.current_temperature ?? "--";
    const targetTemp = stateObj.attributes.temperature ?? "--";
    const hvacMode = stateObj.state;
    const fanMode = stateObj.attributes.fan_mode;

    this.innerHTML = `
      <ha-card style="width:${c.width}; height:${c.height}; overflow:hidden;">
        <style>
          .container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 8%;
            background: rgba(${this._hexToRgb(c.bg_color)}, ${c.bg_opacity});
            border-radius: 1.5em;
            font-size: clamp(10px, 2cqw, 20px);
          }

          .top, .bottom {
            width: 100%;
            display: flex;
            justify-content: space-between;
          }

          .center {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .current { font-size: 2.5em; }
          .target { font-size: 1.2em; opacity: 0.7; }

          .controls {
            display: flex;
            gap: 1.2em;
            margin: 0.5em 0;
          }

          button {
            width: 2.5em;
            height: 2.5em;
            font-size: 1.4em;
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.1);
          }

          .corner ha-icon {
            width: 2em;
            height: 2em;
            opacity: 0.5;
          }

          .active ha-icon {
            opacity: 1;
            transform: scale(1.2);
          }

          .cool.active ha-icon { color: ${c.cool_color}; }
          .heat.active ha-icon { color: ${c.heat_color}; }
          .fan.active ha-icon { color: ${c.fan_color}; }
          .power.active ha-icon { color: ${c.power_color}; }
        </style>

        <div class="container">
          <div class="top">
            <div class="corner power ${hvacMode === 'off' ? 'active' : ''}">
              <ha-icon icon="mdi:power"></ha-icon>
            </div>
            <div class="corner cool ${hvacMode === 'cool' ? 'active' : ''}">
              <ha-icon icon="mdi:snowflake"></ha-icon>
            </div>
          </div>

          <div class="center">
            <div class="current">${currentTemp}°</div>

            <div class="controls">
              <button id="minus">−</button>
              <button id="plus">+</button>
            </div>

            <div class="target">${targetTemp}°</div>
          </div>

          <div class="bottom">
            <div class="corner heat ${hvacMode === 'heat' ? 'active' : ''}">
              <ha-icon icon="mdi:fire"></ha-icon>
            </div>
            <div class="corner fan ${fanMode === 'on' ? 'active' : ''}">
              <ha-icon icon="mdi:fan"></ha-icon>
            </div>
          </div>
        </div>
      </ha-card>
    `;

    this.querySelector("#plus").onclick = () => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this.config.entity,
        temperature: (targetTemp || 0) + 1
      });
    };

    this.querySelector("#minus").onclick = () => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this.config.entity,
        temperature: (targetTemp || 0) - 1
      });
    };
  }

  _hexToRgb(hex) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    return `${(bigint>>16)&255}, ${(bigint>>8)&255}, ${bigint&255}`;
  }
}

customElements.define("corner-thermostat-card", CornerThermostatCard);



class CornerThermostatCardEditor extends HTMLElement {
  setConfig(config) {
    this.config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass) return;

    if (!this.config) this.config = {};

    const entities = Object.keys(this._hass.states || {})
      .filter(e => e.startsWith("climate."));

    this.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <label>Entity</label>
        <select id="entity">
          ${entities.map(e => `<option value="${e}" ${this.config.entity === e ? "selected" : ""}>${e}</option>`).join("")}
        </select>

        <label>Width</label>
        <input id="width" value="${this.config.width || "100%"}">

        <label>Height</label>
        <input id="height" value="${this.config.height || "100%"}">
      </div>
    `;

    this.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("change", () => this._valueChanged());
    });
  }

  _valueChanged() {
    const config = {
      ...this.config,
      entity: this.querySelector("#entity")?.value,
      width: this.querySelector("#width")?.value,
      height: this.querySelector("#height")?.value
    };

    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define("corner-thermostat-card-editor", CornerThermostatCardEditor);


window.customCards = window.customCards || [];
window.customCards.push({
  type: "corner-thermostat-card",
  name: "Corner Thermostat Card",
  description: "Stable version (no editor crash)"
});