

const toSelectOption = ({value, text}) => `<option value="${value}">${text}</option>`
const toRadioOption = ({name, value, text, checked}) => `<div class="row"><input type="radio" name="${name}" value="${value}" ${checked ? "checked" : ""}/><label>${text}</label></div>`
const toCheckboxOption = ({name, text}) => `<input type="checkbox" name="${name}"/><label>${text}</label>`

const getFormValueByName = (html,name) => {
    try {
        return html.find(`[name=${name}]`)[0].value
    } catch (e) {
        return null;
    }
}

const getRadioValueByName = (html,name) => {
    try {
        return html.find(`[name=${name}]:checked`)[0].value
    } catch (e) {
        return null;
    }
}

const getFormCheckedByName = (html,name) => {
    try {
        return html.find(`[name=${name}]`)[0].checked
    } catch (e) {
        return null;
    }
}

const augmentOptions = [
    { name: "empower", value: true, text: "Empower Blood Bolt"},
    { name: "blessed", value: true, text: "Blessed"}
]

const augmentOptionsHtml = augmentOptions.map(toCheckboxOption).join("<br/>")

const advantageOptions = [
    { name: "advantage", value: "1", text: "Advantage"},
    { name: "advantage", value: "0", text: "Normal", checked: true},
    { name: "advantage", value: "-1", text: "Disadvantage"}
]

const advantageOptionsHtml = advantageOptions.map(toRadioOption).join("")


new Dialog({
    title: "Blood Bolt Options",
    content: `
    <form>
        <h3> Augments </h3> 
        <div class="form-group">
            ${augmentOptionsHtml}
        </div>

        <h3> Advantage </h3> 
        <div class="form-group">
            ${advantageOptionsHtml}
        </div>

        <h3> Attack Modifier </h3>
        <div class="form-group">
            <input name="attack-modifier"/>
        </div>
    `,
    buttons: {
        one: {
            icon: '<i class=fas fa-check"><i/>',
            label: "Close",
        }
    },
    close: html => {
        const isEmpowered = getFormCheckedByName(html, "empower")
        const isBlessed = getFormCheckedByName(html, "blessed")
        const advantage = getRadioValueByName(html, "advantage")
        const attackModifier = getFormValueByName(html, "attack-modifier")
        bloodBolt(isEmpowered, isBlessed, advantage, attackModifier)
    }
}).render(true)

const getAdvantageRoll = (advantage) => {
    switch(advantage) {
        case "1": return `2d20kh`
        case "0": return `1d20`
        case "-1": return `2d20kl`
    }
}

function bloodBolt(isEmpowered, isBlessed, advantage, attackModifier) {
    let targets = game.user.targets;

    if (targets.size !== 1) {
        ui.notifications.error("You must target exactly one token with Blood Bolt.");
        return;
    }

    targets.forEach(target => {
        const attackRollString = `${getAdvantageRoll(advantage)} + 9${isBlessed ? " + 1d4" : ""}${attackModifier.length ? " " + attackModifier : ""}`
        const attackRoll = new Roll(attackRollString).roll()
        const attackRollTotal = attackRoll._total

        const isCrit = parseInt(attackRoll._result.slice(0,attackRoll._result.indexOf("+")).trim()) == 20
        const numDice = isCrit ? 6 : 3
        const damageRollString = `${numDice}d10 + 5${isEmpowered ? " + 5":""}`
        const damageRoll = new Roll(damageRollString).roll()
        const damageRollTotal = damageRoll._total

        const selfDamageRollString = `3d4`;
        const selfDamageRoll = new Roll(selfDamageRollString).roll()
        const selfDamageRollTotal = selfDamageRoll._total

        const isHit = attackRollTotal >= target.actor.data.data.attributes.ac.value

        if (isEmpowered) {
            selfDamageRoll.toMessage({
                flavor: `A gout of ${actor.name}'s blood sprays from his self-inflicted wound for ${selfDamageRollTotal} damage`,
                speaker
            })

            actor.update( {
                "data.attributes.hp.value" : actor.data.data.attributes.hp.value - selfDamageRollTotal 
            });
        }

        attackRoll.toMessage({
            flavor: `${actor.name} violently flings a bolt of his own blood towards ${target.name} ${isHit ? (isCrit ? "and <b>critically hits!!!!</b>" : "and hits!") : "but misses :("}`,
            speaker
        })

        
        if (isHit) {
            damageRoll.toMessage({
                flavor: `<b>${target.name}</b> takes <b>${damageRollTotal}</b> ${isEmpowered ? "<b>force</b> damage!" : "necrotic damage!"}`,
                speaker
            })
        }
   })
}

