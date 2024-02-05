"use strict";

const Service = require("egg").Service;
const uAPI = require("uapi-json");
const { apiSettings } = require("../public/setting");

class BookingService extends Service {
  async bookingGalileo(payload) {
    const { ctx, app } = this;
    const AirService = uAPI.createAirService(apiSettings);

    const {segments,IPCC,passengers} = payload;
    if (IPCC) {
      apiSettings.auth.targetBranch = IPCC;
    }

    const book = {
      segments,
      rule: "SIP",
      passengers: passengers,
      phone: {
        countryCode: "86",
        location: "CHN",
        number: "17621580805",
      },
      deliveryInformation: {
        name: "JIA YE",
        street: "shijie road 2000",
        zip: "200000",
        country: "UA",
        city: "ShangHai",
      },
      allowWaitlist: true,
    };

    ctx.logger.info(`booking requestInfo:${JSON.stringify(book)}`)
    // [
    //   {
    //     lastName: "YE",
    //     firstName: "JIA",
    //     passCountry: "UA",
    //     passNumber: "EK6021559",
    //     birthDate: "1986-11-20",
    //     gender: "M",
    //     ageCategory: "ADT",
    //   },
    // ],

    let bookingRes = null;

    await AirService.book(book).then(
      (res) => {
        ctx.logger.info(`booking pnr:${JSON.stringify(res)}`)
        bookingRes = res;
      },
      (err) => {
        ctx.logger.info(`booking error:${err.stack}`)
      }
    );

    return bookingRes;
  }

  async cancelBookingGalileo(payload) {
    const { ctx, app } = this;
    const AirService = uAPI.createAirService(apiSettings);

    const { pnr } = payload;

    const cancelParam = {
      pnr,
      cancelTickets: true,
    };

    let cancelRes = null;

    await AirService.cancelBooking(cancelParam).then(
      (res) => {
        console.log(JSON.stringify(res));
        cancelRes= res;
      },
      (err) => console.log(err)
    );

    return cancelRes;
  }

  async bookingTest() {
    const { ctx, app } = this;
    const AirService = uAPI.createAirService(apiSettings);

    const params = {
      legs: [
        {
          from: 'LAS',
          to: 'LON',
          departureDate: '2023-06-21',
        },
        {
          from: 'LON',
          to: 'LAS',
          departureDate: '2023-06-22',
        },
      ],
      passengers: {
        ADT: 1,
      },
      requestId: 'test-request',
      platingCarier: 'PS'
    };
    
    AirService.shop(params)
      .then(
        (results) => {
          const fromSegments = results['2'].directions['0']['0'].segments;
          const toSegments = results['2'].directions['1']['0'].segments;
          const book = {
            segments: fromSegments.concat(toSegments),
            rule: "SIP",
            passengers: [
              {
                lastName: "YE",
                firstName: "JIA",
                passCountry: "UA",
                passNumber: "EK6021559",
                birthDate: "1986-11-20",
                gender: "M",
                ageCategory: "ADT",
              },
            ],
            phone: {
              countryCode: "86",
              location: "CHN",
              number: "17621580805",
            },
            deliveryInformation: {
              name: "JIA YE",
              street: "shijie road 2000",
              zip: "200000",
              country: "UA",
              city: "ShangHai",
            },
            allowWaitlist: true,
          };
      
          let bookingRes = null;
      
          return AirService.book(book).then(
            (res) => {
              console.log(JSON.stringify(res));
              bookingRes = res;
            },
            (err) => console.log(err)
          );
      
          return bookingRes;
        });

    
  }
}

module.exports = BookingService;
