import create from "zustand";

const useStoreDetectedDevice = create((set) => ({
  detectedDevice: "",
  setDetectedDevice: (device) => set({ detectedDevice: device }),
}));

export default useStoreDetectedDevice;
