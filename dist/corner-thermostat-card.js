class CornerThermostatCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define a climate entity");
    }
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    const stateObj = hass.states[this.config.entity];
    if (!stateObj) return;

    const currentTemp = stateObj.attributes.current_temperature;
    const targetTemp = stateObj.attributes.temperature;
    const hvacMode = stateObj.state;
    const fanMode = stateObj.attributes.fan_mode;

    this.innerHTML = `
      <ha-card>
        <div class="container">

          <!-- CORNERS -->
          <div class="corner power ${hvacMode === 'off' ? 'active' : ''}" id="power">
            ⏻
          </div>

          <div class="corner cool ${hvacMode === 'cool' ? 'active' : ''}" id="cool">
            ❄
          </div>

          <div class="corner heat ${hvacMode === 'heat' ? 'active' : ''}" id="heat">
            🔥
          </div>

          <div class="corner fan ${fanMode === 'on' ? 'active' : ''}" id="fan">
            🌀
          </div>

          <!-- CURRENT TEMP -->
          <div class="current">
            ${currentTemp ?? '--'}°
          </div>

          <!-- CONTROLS -->
          <div class="controls">
            <button id="minus">–</button>
            <button id="plus">+</button>
          </div>

          <!-- TARGET TEMP -->
          <div class="target">
            ${targetTemp ?? '--'}°
          </div>

        </div>
      </ha-card>
    `;

    this._bindActions(stateObj);
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

  static get styles() {
    return `
      ha-card {
        height: 400px;
        border-radius: 24px;
        overflow: hidden;
        background: radial-gradient(circle at center, #1a1a1a 0%, #0f0f0f 100%);
        box-shadow:
          inset 0 0 40px rgba(255,255,255,0.03),
          0 10px 30px rgba(0,0,0,0.6);
      }

      .container {
        position: relative;
        height: 100%;
        color: #eaeaea;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      /* TEMPERATURE TEXT */
      .current {
        font-size: 72px;
        font-weight: 600;
        letter-spacing: 2px;
      }

      .target {
        font-size: 34px;
        opacity: 0.75;
        margin-top: 18px;
      }

      /* BUTTONS */
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
        color: white;
        background: rgba(255,255,255,0.06);
        backdrop-filter: blur(6px);
        box-shadow:
          inset 0 2px 4px rgba(255,255,255,0.05),
          0 4px 10px rgba(0,0,0,0.5);
        transition: all 0.2s ease;
      }

      button:active {
        transform: scale(0.92);
      }

      /* CORNER ICONS */
      .corner {
        position: absolute;
        font-size: 32px;
        opacity: 0.45;
        transition: all 0.25s ease;
        cursor: pointer;
      }

      .corner.active {
        opacity: 1;
        transform: scale(1.1);
      }

      /* POSITIONS */
      .power { top: 18px; left: 18px; }
      .cool { top: 18px; right: 18px; }
      .heat { bottom: 18px; left: 18px; }
      .fan { bottom: 18px; right: 18px; }

      /* GLOW STATES (ONLY WHEN ACTIVE) */
      .cool.active {
        color: #5ab0ff;
        text-shadow:
          0 0 6px rgba(90,176,255,0.6),
          0 0 14px rgba(90,176,255,0.4);
      }

      .heat.active {
        color: #ff6a5a;
        text-shadow:
          0 0 6px rgba(255,106,90,0.6),
          0 0 14px rgba(255,106,90,0.4);
      }

      .fan.active {
        color: #7dffb3;
        text-shadow:
          0 0 6px rgba(125,255,179,0.6),
          0 0 14px rgba(125,255,179,0.4);
      }

      .power.active {
        color: #ffffff;
        text-shadow:
          0 0 6px rgba(255,255,255,0.5);
      }
    `;
  }
}

customElements.define("corner-thermostat-card", CornerThermostatCard);