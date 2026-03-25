class CornerThermostatCard extends HTMLElement {
  setConfig(config) {
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
    if (!this._hass || !this.config || !this.config.entity) return;

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
          :host {
            display: block;
          }

          .container {
            position: relative;
            width: 100%;
            aspect-ratio: 1 / 1;
            background: rgba(${this._hexToRgb(c.bg_color)}, ${c.bg_opacity});
            border-radius: 1.5em;
            color: var(--primary-text-color, #eaeaea);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: min(4vw, 18px);
          }

          .current {
            font-size: 3em;
            font-weight: 600;
          }

          .target {
            font-size: 1.4em;
            opacity: 0.75;
            margin-top: 0.6em;
          }

          .controls {
            display: flex;
            gap: 2em;
            margin-top: 1em;
          }

          button {
            width: 3em;
            height: 3em;
            border-radius: 50%;
            border: none;
            font-size: 1.5em;
            color: var(--primary-text-color);
            background: rgba(255,255,255,0.08);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .corner {
            position: absolute;
            opacity: 0.5;
            cursor: pointer;
            transition: all 0.25s ease;
          }

          .corner ha-icon {
            width: 2.2em;
            height: 2.2em;
          }

          .corner.active {
            opacity: 1;
            transform: scale(1.2);
          }

          .power { top: 5%; left: 5%; }
          .cool { top: 5%; right: 5%; }
          .heat { bottom: 5%; left: 5%; }
          .fan { bottom: 5%; right: 5%; }

          .cool.active ha-icon {
            color: ${c.cool_color};
            filter: drop-shadow(0 0 0.4em ${c.cool_color});
          }

          .heat.active ha-icon {
            color: ${c.heat_color};
            filter: drop-shadow(0 0 0.4em ${c.heat_color});
          }

          .fan.active ha-icon {
            color: ${c.fan_color};
            filter: drop-shadow(0 0 0.4em ${c.fan_color});
          }

          .power.active ha-icon {
            color: ${c.power_color};
            filter: drop-shadow(0 0 0.4em ${c.power_color});
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
  }
}

customElements.define("corner-thermostat-card", CornerThermostatCard);