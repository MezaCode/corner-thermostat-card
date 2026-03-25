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
            height: 100%;
          }

          ha-card {
            height: 100%;
          }

          .container {
            position: relative;
            width: 100%;
            height: 100%;
            background: rgba(${this._hexToRgb(c.bg_color)}, ${c.bg_opacity});
            border-radius: 1.5em;
            color: var(--primary-text-color, #eaeaea);

            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;

            padding: 8%;

            /* dynamic scaling */
            font-size: clamp(10px, 2.5vw, 22px);
          }

          .top,
          .bottom {
            width: 100%;
            display: flex;
            justify-content: space-between;
          }

          .center {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex-grow: 1;
          }

          .current {
            font-size: 3em;
            font-weight: 600;
          }

          .target {
            font-size: 1.3em;
            opacity: 0.75;
            margin-top: 0.5em;
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

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 1.6em;
            line-height: 1;

            background: rgba(255,255,255,0.08);
            color: var(--primary-text-color);

            box-shadow:
              inset 0 0.1em 0.2em rgba(255,255,255,0.08),
              0 0.3em 0.8em rgba(0,0,0,0.5);

            backdrop-filter: blur(0.3em);

            transition: all 0.15s ease;
          }

          button:active {
            transform: scale(0.9);
          }

          .corner {
            opacity: 0.5;
            cursor: pointer;
            transition: all 0.25s ease;
          }

          .corner ha-icon {
            width: 2.4em;
            height: 2.4em;
          }

          .corner.active {
            opacity: 1;
            transform: scale(1.2);
          }

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
          
          <div class="top">
            <div class="corner power ${hvacMode === 'off' ? 'active' : ''}" id="power">
              <ha-icon icon="mdi:power"></ha-icon>
            </div>

            <div class="corner cool ${hvacMode === 'cool' ? 'active' : ''}" id="cool">
              <ha-icon icon="mdi:snowflake"></ha-icon>
            </div>
          </div>

          <div class="center">
            <div class="current">${currentTemp ?? '--'}°</div>

            <div class="controls">
              <button id="minus">−</button>
              <button id="plus">+</button>
            </div>

            <div class="target">${targetTemp ?? '--'}°</div>
          </div>

          <div class="bottom">
            <div class="corner heat ${hvacMode === 'heat' ? 'active' : ''}" id="heat">
              <ha-icon icon="mdi:fire"></ha-icon>
            </div>

            <div class="corner fan ${fanMode === 'on' ? 'active' : ''}" id="fan">
              <ha-icon icon="mdi:fan"></ha-icon>
            </div>
          </div>

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