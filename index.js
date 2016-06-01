var settings = require('./settings'),
    request = require('request'),
    fs = require('fs'),
    path = require('path'),
    push = require('pushover-notifications'),
    url = 'http://admin:' + settings.landroid_pin + '@' + settings.landroid_host + '/jsondata.cgi',
    stateFilePath = path.join(__dirname, 'state.json');

var OK = 0;
var LANDROID_ALARM = 1;
var CONNECTION_ERROR = 2;

try {
    fs.accessSync(stateFilePath, fs.F_OK);
} catch (e) {
    fs.writeFileSync(stateFilePath, JSON.stringify({ state: OK }));
}

request(url, function (error, response, body) {

    if (error !== null) {
        setState(CONNECTION_ERROR);
        return;
    }

    var response = JSON.parse(body);

    response.allarmi.forEach(function(val, index) {
        if (val > 0) {
            setState(LANDROID_ALARM, index);
            return;
        }
    });

    setState(OK);

});

function setState(state, val) {

    fs.readFile(stateFilePath, 'utf8', function (err, data) {
        if (err) {
            throw err;
        }

        var currentState = JSON.parse(data);

        if (currentState.state === state) {
            return;
        }

        var title,
            alarms = [
                "Blade blocked",
                "Repositioning error",
                "Outside wire (Outside working area)",
                "Blade blocked",
                "Outside wire (Outside working area)",
                "Mower lifted (Lifted up)",
                "Error",
                "Error (Set when Lifted up - Upside down?)",
                "Error",
                "Collision sensor blocked",
                "Mower tilted",
                "Charge error (Set when Lifted up?)",
                "Battery error"
            ];

        switch (state) {
            case OK:
                title = "OK";
                break;
            case LANDROID_ALARM:
                title = alarms[val];
                break;
            case CONNECTION_ERROR:
                title = "Connection error";
                break;
        }

        var message = 'Landroid';

        var msg = {
            title: title,
            message: message
        };

        settings.pushover_users.forEach((user) => {

            var p = new push({
                user: user,
                token: settings.pushover_token
            });

            p.send(msg, function(err, result) {
               
                if (err) {
                    throw err;
                }

            });
        });


        fs.writeFile(stateFilePath, JSON.stringify({ state: state, val: val }));


    });


}