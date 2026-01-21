const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- MOCK ENVIRONMENT ---
const globalContext = {
    console: console,
    Utilities: {
        formatDate: (d) => d.toISOString(),
        sleep: () => { }
    }
};

vm.createContext(globalContext);

// --- LOAD FILES ---
function loadParams(filePath) {
    let content = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');

    let className = '';
    if (filePath.includes('classifier')) className = 'RequestTypeClassifier';
    if (filePath.includes('validator')) className = 'ResponseValidator';

    if (className) {
        // Appendi il nome della classe per restituirlo come risultato dell'espressione
        content += `\n;${className};`;
        try {
            const classRef = vm.runInContext(content, globalContext);
            globalContext[className] = classRef;
        } catch (e) {
            console.error(`Errore caricamento ${filePath}:`, e);
        }
    } else {
        vm.runInContext(content, globalContext);
    }
}

console.log("📦 Caricamento Moduli GAS...");
loadParams('../gas_request_classifier.js');
loadParams('../gas_response_validator.js');

// --- ESTRAI CLASSI ---
const RequestClassifier = globalContext.RequestTypeClassifier;
const ResponseValidator = globalContext.ResponseValidator;

if (!RequestClassifier || !ResponseValidator) {
    console.error("❌ Impossibile caricare le classi dal contesto VM.");
    console.log("Keys in context:", Object.keys(globalContext));
    process.exit(1);
}

// --- TEST SUITE ---
console.log("\n🧪 AVVIO TEST SUITE\n");

// 1. TEST VALIDATORE (Self-Healing)
console.log("▶️  TEST ResponseValidator (Self-Healing)");
const validator = new ResponseValidator();

const testCases = [
    {
        name: "Fix Maiuscola dopo virgola (Congiunzione E)",
        input: "Salve, E benvenuti.",
        expectedPart: ", e benvenuti",
        shouldFix: true
    },
    {
        name: "Fix Maiuscola dopo virgola (Standard)",
        input: "Ciao, Come stai?",
        expectedPart: ", come stai",
        shouldFix: true
    },
    {
        name: "Preserva Nomi Propri",
        input: "Ciao, Marco.",
        expectedPart: ", Marco",
        shouldFix: false
    },
    {
        name: "Fix Link Duplicati",
        input: "[https://google.com](https://google.com)",
        expectedPart: "https://google.com",
        notExpected: "[",
        shouldFix: true
    }
];

testCases.forEach(tc => {
    const result = validator.validateResponse(tc.input, 'it', '', '', '', 'full', true);
    let passed = false;
    let msg = '';

    if (tc.shouldFix) {
        if (result.fixedResponse) {
            if (result.fixedResponse.includes(tc.expectedPart)) {
                if (tc.notExpected && result.fixedResponse.includes(tc.notExpected)) {
                    passed = false;
                    msg = `Contiene ancora '${tc.notExpected}'`;
                } else {
                    passed = true;
                    msg = `Corretto: "${result.fixedResponse}"`;
                }
            } else {
                passed = false;
                msg = `Expected part "${tc.expectedPart}" not found. Got: "${result.fixedResponse}"`;
            }
        } else {
            if (tc.input.includes(tc.expectedPart)) {
                passed = true;
                msg = "Input già corretto.";
            } else {
                passed = false;
                // Add detail about errors if any
                msg = `Nessun fix applicato. Errors: ${result.errors ? result.errors.join(', ') : 'none'}`;
            }
        }
    } else {
        if (!result.fixedResponse || result.fixedResponse === tc.input) {
            passed = true;
        } else {
            passed = false;
            msg = `Modificato erroneamente in: ${result.fixedResponse}`;
        }
    }

    console.log(`   [${passed ? '✅' : '❌'}] ${tc.name} ${passed ? '' : ' -> ' + msg}`);
});

// 2. TEST CLASSIFICATORE
console.log("\n▶️  TEST RequestTypeClassifier (Multi-Dim)");
const classifier = new RequestClassifier();

const classifyTests = [
    {
        name: "Sbattezzo (Formale)",
        subject: "Richiesta sbattezzo",
        body: "Vorrei essere cancellato dal registro dei battezzati ai sensi del GDPR.",
        expectedType: "formal",
        minDim: { formal: 0.8 }
    },
    {
        name: "Orari Messa (Tecnico)",
        subject: "Orari messe",
        body: "Quali sono gli orari delle messe di domenica?",
        expectedType: "technical",
        minDim: { technical: 0.5 }
    }
];

classifyTests.forEach(ct => {
    const res = classifier.classify(ct.subject, ct.body);
    let passed = true;
    let details = '';

    if (res.type !== ct.expectedType && res.dimensions[ct.expectedType] < 0.6) {
        passed = false;
        details += `Type mismatch: got ${res.type}, expected ${ct.expectedType}. `;
    }

    for (const [dim, val] of Object.entries(ct.minDim)) {
        if (res.dimensions[dim] < val) {
            passed = false;
            details += `Dim ${dim} too low (${res.dimensions[dim].toFixed(2)} < ${val}). `;
        }
    }

    console.log(`   [${passed ? '✅' : '❌'}] ${ct.name} -> Type: ${res.type}, Dims: [T:${res.dimensions.technical.toFixed(1)} P:${res.dimensions.pastoral.toFixed(1)} D:${res.dimensions.doctrinal.toFixed(1)} F:${res.dimensions.formal.toFixed(1)}] ${details}`);
});
