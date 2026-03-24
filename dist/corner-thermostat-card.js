class CornerThermostatCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define a climate entity");
    }

    this.config = {
      bg_color: "#1a1a1a",
      bg_opacity: 1,
      cool_color: "#5ab0ff",
      heat_color: "#ff6a5a",
      fan_color: "#7dffb3",
      power_color: "#ffffff",
      theme: "",
      ...config
    };
  }

  static getConfigElement() {
    return document.createElement("corner-thermostat-card-editor");
  }

  static getStubConfig(hass) {
    const entity = Object.keys(hass.states).find(e =>
      e.startsWith("climate.")
    );
    return { entity: entity || "" };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this.config) return;

    const stateObj = this._hass.states[this.config.entity];
    if (!stateObj) return;

    const c = this.config;

    const currentTemp = stateObj.attributes.current_temperature;
    const targetTemp = stateObj.attributes.temperature;
    const hvacMode = stateObj.state;
    const fanMode = stateObj.attributes.fan_mode;

    this.innerHTML = `
      <ha-card ${c.theme ? `data-theme="${c.theme}"` : ""}>
        <style>
          .container {
            position: relative;
            height: 400px;
            background: rgba(${this._hexToRgb(c.bg_color)}, ${c.bg_opacity});
            border-radius: 24px;
            color: var(--primary-text-color, #eaeaea);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .current {
            font-size: 72px;
            font-weight: 600;
          }

          .target {
            font-size: 34px;
            opacity: 0.75;
            margin-top: 18px;
          }

          .controls {
            display: flex;
            gap: 50px;
            margin-top: 20px;
          }

          button {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            border: none;
            font-size: 30px;
            color: var(--primary-text-color);
            background: rgba(255,255,255,0.06);
          }

          .corner {
            position: absolute;
            opacity: 0.45;
            cursor: pointer;
          }

          .corner ha-icon {
            width: 28px;
            height: 28px;
          }

          .corner.active {
            opacity: 1;
            transform: scale(1.15);
          }

          .power { top: 18px; left: 18px; }
          .cool { top: 18px; right: 18px; }
          .heat { bottom: 18px; left: 18px; }
          .fan { bottom: 18px; right: 18px; }

          .cool.active ha-icon {
            color: ${c.cool_color};
            filter: drop-shadow(0 0 6px ${c.cool_color});
          }

          .heat.active ha-icon {
            color: ${c.heat_color};
            filter: drop-shadow(0 0 6px ${c.heat_color});
          }

          .fan.active ha-icon {
            color: ${c.fan_color};
            filter: drop-shadow(0 0 6px ${c.fan_color});
          }

          .power.active ha-icon {
            color: ${c.power_color};
            filter: drop-shadow(0 0 6px ${c.power_color});
          }
        </style>

        <div class="container">
          <div class="corner power ${hvacMode === 'off' ? 'active' : ''}" id="power">
            <ha-icon icon="mdi:power"></ha-icon>
          </div>

          <div class="corner cool ${hvacMode === 'cool' ? 'active' : ''}" id="cool">
            <ha-icon icon="mdi:snowflake"></ha-icon>
          </div>

          <div class="corner heat ${hvacMode === 'heat' ? 'active' : ''}" id="heat">
            <ha-icon icon="mdi:fire"></ha-icon>
          </div>

          <div class="corner fan ${fanMode === 'on' ? 'active' : ''}" id="fan">
            <ha-icon icon="mdi:fan"></ha-icon>
          </div>

          <div class="current">${currentTemp ?? '--'}°</div>

          <div class="controls">
            <button id="minus">–</button>
            <button id="plus">+</button>
          </div>

          <div class="target">${targetTemp ?? '--'}°</div>
        </div>
      </ha-card>
    `;

    this._bindActions(stateObj);
  }

  _hexToRgb(hex) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
  }

  _bindActions(stateObj) {
    const entity = this.config.entity;

    this.querySelector("#plus").onclick = () => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: entity,
        temperature: (stateObj.attributes.temperature ?? 0) + 1
      });
    };

    this.querySelector("#minus").onclick = () => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: entity,
        temperature: (stateObj.attributes.temperature ?? 0) - 1
      });
    };

    this.querySelector("#cool").onclick = () => {
      this._hass.callService("climate", "set_hvac_mode", {
        entity_id: entity,
        hvac_mode: "cool"
      });
    };

    this.querySelector("#heat").onclick = () => {
      this._hass.callService("climate", "set_hvac_mode", {
        entity_id: entity,
        hvac_mode: "heat"
      });
    };

    this.querySelector("#power").onclick = () => {
      this._hass.callService("climate", "set_hvac_mode", {
        entity_id: entity,
        hvac_mode: "off"
      });
    };

    this.querySelector("#fan").onclick = () => {
      const newMode =
        stateObj.attributes.fan_mode === "on" ? "auto" : "on";

      this._hass.callService("climate", "set_fan_mode", {
        entity_id: entity,
        fan_mode: newMode
      });
    };
  }
}

customElements.define("corner-thermostat-card", CornerThermostatCard);

class CornerThermostatCardEditor extends HTMLElement {
  setConfig(config) {
    this.config = config;
    this._updatePreview();
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this._updatePreview();
    this.render();
  }

  render() {
    if (!this._hass) return;

    const entities = Object.keys(this._hass.states)
      .filter(e => e.startsWith("climate."));

    const themes = this._hass.themes?.themes || {};
    const themeNames = Object.keys(themes);

    this.innerHTML = `
      <div style="display:flex; gap:20px;">
        
        <div style="flex:1; display:flex; flex-direction:column; gap:10px;">

          <label>Climate Entity</label>
          <select id="entity">
            ${entities.map(e => `<option value="${e}" ${this.config.entity === e ? "selected" : ""}>${e}</option>`).join("")}
          </select>

          <label>Theme</label>
          <select id="theme">
            <option value="">None</option>
            ${themeNames.map(name => `<option value="${name}" ${this.config.theme === name ? "selected" : ""}>${name}</option>`).join("")}
          </select>

          <label>Background Color</label>
          <input type="color" id="bg_color" value="${this.config.bg_color || "#1a1a1a"}">

          <label>Background Opacity</label>
          <input type="range" min="0" max="1" step="0.05" id="bg_opacity" value="${this.config.bg_opacity ?? 1}">

          <label>Cool Color</label>
          <input type="color" id="cool_color" value="${this.config.cool_color || "#5ab0ff"}">

          <label>Heat Color</label>
          <input type="color" id="heat_color" value="${this.config.heat_color || "#ff6a5a"}">

          <label>Fan Color</label>
          <input type="color" id="fan_color" value="${this.config.fan_color || "#7dffb3"}">

          <label>Power Color</label>
          <input type="color" id="power_color" value="${this.config.power_color || "#ffffff"}">
        </div>

        <div style="flex:1; display:flex; align-items:center; justify-content:center;">
          <div id="preview"></div>
        </div>

      </div>
    `;

    this.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("change", () => {
        this.config = {
          ...this.config,
          entity: this.querySelector("#entity").value,
          theme: this.querySelector("#theme").value,
          bg_color: this.querySelector("#bg_color").value,
          bg_opacity: parseFloat(this.querySelector("#bg_opacity").value),
          cool_color: this.querySelector("#cool_color").value,
          heat_color: this.querySelector("#heat_color").value,
          fan_color: this.querySelector("#fan_color").value,
          power_color: this.querySelector("#power_color").value
        };

        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: this.config },
          bubbles: true,
          composed: true
        }));

        this._updatePreview();
      });
    });

    this._updatePreview();
  }

  _updatePreview() {
    if (!this._hass || !this.config) return;

    const preview = this.querySelector("#preview");
    if (!preview) return;

    preview.innerHTML = "";

    const card = document.createElement("corner-thermostat-card");
    card.setConfig(this.config);
    card.hass = this._hass;

    preview.appendChild(card);
  }
}

customElements.define("corner-thermostat-card-editor", CornerThermostatCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "corner-thermostat-card",
  name: "Corner Thermostat Card",
  description: "Custom thermostat with live preview + theme support"
});