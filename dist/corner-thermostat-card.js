class CornerThermostatCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) throw new Error("Entity required");

    this.config = {
      accent: "#7da2b8",
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

    const temp = stateObj.attributes.current_temperature ?? "--";
    const target = stateObj.attributes.temperature ?? "--";

    this.innerHTML = `
      <ha-card>
        <style>
          ha-card {
            height: 100%;
            border-radius: 16px;
            overflow: hidden;
          }

          .wrapper {
            position: relative;
            height: 100%;
            padding: 16px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            color: var(--primary-text-color);
          }

          /* BACKGROUND BLOB */
          .blob {
            position: absolute;
            width: 120px;
            height: 120px;
            background: ${this.config.accent};
            opacity: 0.25;
            border-radius: 50%;
            bottom: -40px;
            left: -40px;
          }

          /* HEADER */
          .top {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .title {
            font-size: 14px;
            opacity: 0.7;
          }

          .icon-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${this.config.accent};
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* TEMP DISPLAY */
          .center {
            text-align: center;
          }

          .temp {
            font-size: 32px;
            font-weight: 600;
          }

          .controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 8px;
          }

          button {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.2);
            background: transparent;
            color: white;
          }

          .target {
            font-size: 14px;
            opacity: 0.6;
            margin-top: 4px;
          }
        </style>

        <div class="wrapper">
          <div class="blob"></div>

          <div class="top">
            <div class="title">Thermostat</div>
            <div class="icon-circle">
              <ha-icon icon="mdi:thermometer"></ha-icon>
            </div>
          </div>

          <div class="center">
            <div class="temp">${temp}°</div>

            <div class="controls">
              <button id="minus">−</button>
              <button id="plus">+</button>
            </div>

            <div class="target">${target}° target</div>
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
  }
}

customElements.define("corner-thermostat-card", CornerThermostatCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "corner-thermostat-card",
  name: "Thermostat Tile",
  description: "Matches dashboard tile style",
  preview: true
});