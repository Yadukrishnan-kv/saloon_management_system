import React, { createContext, useState } from "react";

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [bookingDate, setBookingDate] = useState("");
  const [timeSlot, setTimeSlot] = useState({ startTime: "", endTime: "" });
  const [selectedBeautician, setSelectedBeautician] = useState(null);
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const addService = (service) => {
    setSelectedServices((prev) => {
      if (prev.find((s) => s._id === service._id)) return prev;
      return [...prev, service];
    });
  };

  const removeService = (serviceId) => {
    setSelectedServices((prev) => prev.filter((s) => s._id !== serviceId));
  };

  const clearBooking = () => {
    setSelectedServices([]);
    setBookingDate("");
    setTimeSlot({ startTime: "", endTime: "" });
    setSelectedBeautician(null);
    setAddress({ street: "", city: "", state: "", pincode: "" });
  };

  const getTotalAmount = () => {
    return selectedServices.reduce((sum, s) => {
      const discountedPrice = s.price - (s.price * (s.discount || 0)) / 100;
      return sum + discountedPrice;
    }, 0);
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);
  };

  return (
    <BookingContext.Provider
      value={{
        selectedServices,
        bookingDate,
        timeSlot,
        selectedBeautician,
        address,
        setBookingDate,
        setTimeSlot,
        setSelectedBeautician,
        setAddress,
        addService,
        removeService,
        clearBooking,
        getTotalAmount,
        getTotalDuration,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};
