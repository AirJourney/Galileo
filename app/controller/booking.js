"use strict";

const Controller = require("egg").Controller;

class BookingApiController extends Controller {
  async booking() {
    const { ctx } = this;
    const bookingRes = await ctx.service.booking.bookingGalileo(ctx.request.body);
    if (bookingRes && bookingRes.length > 0) {
      ctx.helper.ResFormat(ctx, null, true, "Booking Success", bookingRes);
    } else {
      ctx.helper.ResFormat(ctx, null, false, "Booking Fail", bookingRes);
    }

    /**[
        {
          from: "EWR",
          to: "LAX",
          bookingClass: "B",
          departure: "2023-06-19T10:30:00.000+08:00",
          arrival: "2023-06-19T13:26:00.000+08:00",
          airline: "UA",
          flightNumber: "1745",
          serviceClass: "Economy",
          plane: "752",
          fareBasisCode: "SAA3JHIS",
          group: 0,
        },
      ] */
  }

  async cancelBooking() {
    const { ctx } = this;
    const { pnr } = ctx.request.body;
    if (!pnr) {
      ctx.helper.ResFormat(ctx, null, false, "PNR is empty", null);
      return;
    }

    const cancelRes = await ctx.service.booking.cancelBookingGalileo({ pnr });
    if (cancelRes == true) {
      ctx.helper.ResFormat(
        ctx,
        null,
        true,
        "Cancel Booking Success",
        cancelRes
      );
    } else {
      ctx.helper.ResFormat(
        ctx,
        null,
        true,
        "Cancel Booking Partial Fail",
        cancelRes
      );
    }
  }
}

module.exports = BookingApiController;
