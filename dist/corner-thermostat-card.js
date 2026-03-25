class CornerThermostatCard extends HTMLElement {
  setConfig(config) {
    this.config = {
      entity: "",
      width: "100%",
      height: "100%",
      bg_color: "#1a1a1a",
      bg_opacity: 1,
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

    const currentTemp = stateObj.attributes.current_temperature ?? "--";
    const targetTemp = stateObj.attributes.temperature ?? "--";

    this.innerHTML = `
      <ha-card style="width:${this.config.width}; height:${this.config.height};">
        <div style="
          width:100%;
          height:100%;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          font-size:1.2em;
        ">
          <div style="font-size:2em;">${currentTemp}°</div>
          <div style="display:flex; gap:10px; margin:10px;">
            <button id="minus">−</button>
            <button id="plus">+</button>
          </div>
          <div>${targetTemp}°</div>
        </div>
      </ha-card>
    `;

    this.querySelector("#plus").onclick = () => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this.config.entity,
        temperature: targetTemp + 1
      });
    };

    this.querySelector("#minus").onclick = () => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this.config.entity,
        temperature: targetTemp - 1
      });
    };
  }
}

customElements.define("corner-thermostat-card", CornerThermostatCard);



class CornerThermostatCardEditor extends HTMLElement {
  setConfig(config) {
    this.config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this.config) return;

    const entities = Object.keys(this._hass.states || {})
      .filter(e => e.startsWith("climate."));

    this.innerHTML = `
      <div style="display:flex; gap:16px;">
        
        <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
          
          <label>Entity</label>
          <select id="entity">
            ${entities.map(e => `
              <option value="${e}" ${this.config.entity === e ? "selected" : ""}>
                ${e}
              </option>
            `).join("")}
          </select>

          <label>Width</label>
          <input id="width" value="${this.config.width || "100%"}">

          <label>Height</label>
          <input id="height" value="${this.config.height || "100%"}">

        </div>

        <div id="preview" style="flex:1;"></div>

      </div>
    `;

    this.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("change", () => this._valueChanged());
    });

    this._updatePreview();
  }

  _valueChanged() {
    if (!this._hass) return;

    const newConfig = {
      ...this.config,
      entity: this.querySelector("#entity")?.value,
      width: this.querySelector("#width")?.value,
      height: this.querySelector("#height")?.value
    };

    this.config = newConfig;

    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    }));

    this._updatePreview();
  }

  _updatePreview() {
    const preview = this.querySelector("#preview");
    if (!preview || !this._hass || !this.config.entity) return;

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
  description: "Thermostat with size control + working editor"
});