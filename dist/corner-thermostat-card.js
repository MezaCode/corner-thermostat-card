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
          }

          .corner {
            position: absolute;
            font-size: 32px;
            opacity: 0.45;
            cursor: pointer;
          }

          .corner.active {
            opacity: 1;
            transform: scale(1.1);
          }

          .power { top: 18px; left: 18px; }
          .cool { top: 18px; right: 18px; }
          .heat { bottom: 18px; left: 18px; }
          .fan { bottom: 18px; right: 18px; }

          .cool.active {
            color: #5ab0ff;
            text-shadow: 0 0 10px rgba(90,176,255,0.7);
          }

          .heat.active {
            color: #ff6a5a;
            text-shadow: 0 0 10px rgba(255,106,90,0.7);
          }

          .fan.active {
            color: #7dffb3;
            text-shadow: 0 0 10px rgba(125,255,179,0.7);
          }

          .power.active {
            color: #fff;
            text-shadow: 0 0 8px rgba(255,255,255,0.6);
          }
        </style>

        <div class="container">

          <div class="corner power ${hvacMode === 'off' ? 'active' : ''}" id="power">⏻</div>
          <div class="corner cool ${hvacMode === 'cool' ? 'active' : ''}" id="cool">❄</div>
          <div class="corner heat ${hvacMode === 'heat' ? 'active' : ''}" id="heat">🔥</div>
          <div class="corner fan ${fanMode === 'on' ? 'active' : ''}" id="fan">🌀</div>

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