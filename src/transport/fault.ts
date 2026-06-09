export interface SascarSoapFault {
  faultcode: string;
  faultstring: string;
  detail?: string;
}

export const FAULT_STUB: SascarSoapFault = {
  faultcode: 'stub',
  faultstring: 'stub'
};
