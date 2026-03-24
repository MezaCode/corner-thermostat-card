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
        <style>
          .container {
            position: relative;
            height: 400px;
            background: radial-gradient(circle at center, #1a1a1a 0%, #0f0f0f 100%);
            border-radius: 24px;
            color: #eaeaea;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

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

          .corner {
            position: absolute;
            opacity: 0.45;
            cursor: pointer;
            transition: all 0.25s ease;
          }

          .corner ha-icon {
            width: 28px;
            height: 28px;
          }

          .corner.active {
            opacity: 1;
            transform: scale(1.15);
          }

          /* POSITIONS */
          .power { top: 18px; left: 18px; }
          .cool { top: 18px; right: 18px; }
          .heat { bottom: 18px; left: 18px; }
          .fan { bottom: 18px; right: 18px; }

          /* GLOW EFFECTS */
          .cool.active ha-icon {
            color: #5ab0ff;
            filter: drop-shadow(0 0 6px rgba(90,176,255,0.7))
                    drop-shadow(0 0 12px rgba(90,176,255,0.4));
          }

          .heat.active ha-icon {
            color: #ff6a5a;
            filter: drop-shadow(0 0 6px rgba(255,106,90,0.7))
                    drop-shadow(0 0 12px rgba(255,106,90,0.4));
          }

          .fan.active ha-icon {
            color: #7dffb3;
            filter: drop-shadow(0 0 6px rgba(125,255,179,0.7))
                    drop-shadow(0 0 12px rgba(125,255,179,0.4));
          }

          .power.active ha-icon {
            color: #ffffff;
            filter: drop-shadow(0 0 6px rgba(255,255,255,0.6));
          }
        </style>

        <div class="container">

          <!-- CORNER ICONS -->
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
}

customElements.define("corner-thermostat-card", CornerThermostatCard);