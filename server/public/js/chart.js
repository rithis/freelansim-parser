$(function () {
    var charts = [
        ['/balances', 'balances', 'Balance'],
        ['/positions', 'positions', 'Position']
    ];

    charts.forEach(function (chart) {
        var url = chart[0];
        var id = chart[1];
        var name = chart[2];

        $.getJSON(url, function (data) {
            var result = [];
            var last;
            
            for (var i = 0; i < data.length; i++) {
                result.push([
                    new Date(data[i].date).getTime(),
                    data[i].value
                ]);
                last = data[i].value;
            }
            result.push([Date.now(), last]);

            new Highcharts.Chart({
                chart: {renderTo: id},
                title: {text: name},
                xAxis: {type: 'datetime'},
                yAxis: {title: {text: "Value"}, min: 0},
                series: [{name: name, data: result}]
            });
        });
    });
});
