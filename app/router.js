'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  
  router.get('/', controller.home.index);
  router.post('/currency',controller.test.currency);
  router.post('/segment',controller.test.segment);
  router.post('/testbooking',controller.test.booking);

  router.get('/job',controller.switch.jobSwitch);
  router.post('/check',controller.check.check);

  router.post('/booking',controller.booking.booking);
  router.post('/cancelbooking',controller.booking.cancelBooking);

  router.post('/checkflight',controller.check.checkflight);

  // Test Api
  router.get('/test', controller.test.test);
  router.post('/test2', controller.test.testSeg);
  router.post('/addDay', controller.test.addDay);
  router.get('/db2', controller.switch.index);
  router.get('/dbsearch', controller.test.dbSearch);

};
