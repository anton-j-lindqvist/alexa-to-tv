# alexa-to-tv
Making my Alexa control my TV in the precise way I want.

## How to use

### Prerequesites
* Amazon Developer Account
* Amazon Alexa
* Samsung TV
* Server, can be local and use a tunnel

### Make .env files

You will need one .env file for your alexa-script and your tv-handling.

```
Alexa-script .env
HOST_URL= URL to your server or tunnel.
AUTH_TOKEN= Generate a token
```
```
TV-handler .env
TV_IP= Your TVs IP
AUTH_TOKEN= This will be generated in console on the first connection
ALEXA_AUTH_TOKEN= Use the same token as in Alexa-script
SERVER_PORT= Preferred server port
```

### Create Alexa skill

* Log in to your Amazon Developer account
* Create an Alexa skill
* Create your slot types
  * POWER_ON_OFF - values on and off
  * VOLUME_UP_DOWN - values up and down
* Create your intents
  * TVPowerIntent - make sure you have POWER_ON_OFF slot active
  * TVVolumeIntent - make sure you have VOLUME_UP_DOWN and AMAZON.NUMBER slots active 
* Upload all the code, including .env file

### Final steps

* Put your skill on your Alexa
* Start your node-server
