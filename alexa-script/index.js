const Alexa = require('ask-sdk-core');
require('dotenv').config();
const https = require('https');

const AUTH_TOKEN = process.env.AUTH_TOKEN;
const HOST_URL = process.env.HOST_URL;

//Helper function sending JSON to your home server
function sendTvCommand(keyName, count) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            key: keyName,
            auth_token: AUTH_TOKEN,
            count: count
        });

        const options = {
            hostname: HOST_URL,
            port: 443,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'ngrok-skip-browser-warning': 'true' //Not mandatory, use if using ngrok tunneling
            }
        };

        const req = https.request(options, (res) => {
            console.log(`Status from tunnel: ${res.statusCode}`);
            res.on('data', () => { });
            res.on('end', () => resolve(res.statusCode));
        });

        req.on('error', (err) => {
            console.error('Network error:', err);
            reject(err);
        });

        req.write(data);
        req.end();
    });
}

//Helper function parsing for correct synonms said to Alexa
function getSlotCanonicalValue(slot) {
    if (!slot || !slot.value) return null;

    if (
        slot.resolutions &&
        slot.resolutions.resolutionsPerAuthority &&
        slot.resolutions.resolutionsPerAuthority[0] &&
        slot.resolutions.resolutionsPerAuthority[0].values &&
        slot.resolutions.resolutionsPerAuthority[0].values[0] &&
        slot.resolutions.resolutionsPerAuthority[0].values[0].value &&
        slot.resolutions.resolutionsPerAuthority[0].values[0].value.name
    ) {
        return slot.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    }

    return slot.value;
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'You can now control your TV';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Controller is started, you may turn the TV on or off, change volume or select an application.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};

const TvPowerHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TVPowerIntent';
    },
    async handle(handlerInput) {
        let option = getSlotCanonicalValue(handlerInput.requestEnvelope.request.intent.slots.power);
        let speakOutput = 'Turning ' + option + ' TV';

        try {
            await sendTvCommand('KEY_POWER', 1); //works for both turning off and on the TV
        } catch (error) {
            console.error('Failed:', error);
            speakOutput = 'Could not reach the TV server.';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
}

const TvVolumeHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TVVolumeIntent';
    },
    async handle(handlerInput) {
        let option = getSlotCanonicalValue(handlerInput.requestEnvelope.request.intent.slots.option);
        let count = getSlotCanonicalValue(handlerInput.requestEnvelope.request.intent.slots.count);
        let speakOutput = 'Turning ' + option + ' the volume';

        try {
            await sendTvCommand(option === 'up' ? 'KEY_VOLUP' : 'KEY_VOLDOWN', count);
        } catch (error) {
            console.error('Failed:', error);
            speakOutput = 'Could not reach the TV server.';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
}

const AppIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TVVolumeIntent';
    },
    async handle(handlerInput) {
        let option = getSlotCanonicalValue(handlerInput.requestEnvelope.request.intent.slots.app);
        let speakOutput = 'Starting ' + option;

        try {
            await sendTvCommand(option);
        } catch (error) {
            console.error('Failed:', error);
            speakOutput = 'Could not reach the TV server.';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
}


/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        AppIntentHandler,
        TvPowerHandler,
        TvVolumeHandler,
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();