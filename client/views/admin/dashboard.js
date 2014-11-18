Template.Dashboard.helpers({
    report_query: function () {
        var startDate = moment().subtract('days', 29).format('YYYY-MM-DD');
        var endDate =  moment().format('YYYY-MM-DD');
        return '?startDate=' + startDate + '&endDate=' + endDate;
    }
})