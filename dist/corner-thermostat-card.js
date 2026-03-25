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
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
          }

          /* BACKGROUND BLOBS */
          .blob {
            position: absolute;
            border-radius: 50%;
            opacity: 0.08;
            background: white;
          }

          .b1 { width: 140px; height: 140px; top: -40px; right: -40px; }
          .b2 { width: 120px; height: 120px; bottom: -30px; left: -30px; }
          .b3 { width: 100px; height: 100px; top: 40%; left: 20%; }

          /* CENTER TEMP */
          .current {
            font-size: 48px;
            font-weight: 600;
          }

          .target {
            margin-top: 10px;
            font-size: 20px;
            opacity: 0.7;
          }

          /* CONTROLS */
          .controls {
            position: absolute;
            top: 55%;
            display: flex;
            gap: 40px;
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

          /* CORNER ICONS */
          .corner {
            position: absolute;
            opacity: 0.5;
            transition: all 0.25s ease;
          }

          .corner ha-icon {
            width: 26px;
            height: 26px;
          }

          .corner.active {
            opacity: 1;
            transform: scale(1.2);
          }

          /* EVEN SPACING (FIXED) */
          .power { top: 16px; left: 16px; }
          .cool { top: 16px; right: 16px; }
          .heat { bottom: 16px; left: 16px; }
          .fan { bottom: 16px; right: 16px; }

          /* GLOW STATES */
          .cool.active ha-icon {
            color: ${this.config.cool_color};
            filter: drop-shadow(0 0 8px ${this.config.cool_color});
          }

          .heat.active ha-icon {
            color: ${this.config.heat_color};
            filter: drop-shadow(0 0 8px ${this.config.heat_color});
          }

          .fan.active ha-icon {
            color: ${this.config.fan_color};
            filter: drop-shadow(0 0 8px ${this.config.fan_color});
          }

          .power.active ha-icon {
            color: ${this.config.power_color};
            filter: drop-shadow(0 0 8px ${this.config.power_color});
          }
        </style>

        <div class="wrap">
          <div class="blob b1"></div>
          <div class="blob b2"></div>
          <div class="blob b3"></div>

          <div class="corner power ${hvac === 'off' ? 'active' : ''}">
            <ha-icon icon="mdi:power"></ha-icon>
          </div>

          <div class="corner cool ${hvac === 'cool' ? 'active' : ''}">
            <ha-icon icon="mdi:snowflake"></ha-icon>
          </div>

          <div class="corner heat ${hvac === 'heat' ? 'active' : ''}">
            <ha-icon icon="mdi:fire"></ha-icon>
          </div>

          <div class="corner fan ${fan === 'on' ? 'active' : ''}">
            <ha-icon icon="mdi:fan"></ha-icon>
          </div>

          <div class="current">${current}°</div>

          <div class="controls">
            <button id="minus">−</button>
            <button id="plus">+</button>
          </div>

          <div class="target">${target}°</div>
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
  }
}

customElements.define("corner-thermostat-card", CornerThermostatCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "corner-thermostat-card",
  name: "Corner Thermostat",
  preview: true
});