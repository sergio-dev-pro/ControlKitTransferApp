export function isValidEmail(mail) {
  if (!mail.length) return false;
  // var validRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  // if (mail.match(validRegex)) {
  //   return true;
  // } else {
  //   return false;
  // }
  
  return mail.includes("@");
}


export const validateDate = date => {
  if (!date || date.length < 10) return false;
  const dateSplited = date.split('/');
  const year = parseInt(dateSplited[2]);
  // console.log('validateDate', dateSplited);
  const isLeapYear = year % 100 === 0 ? year % 400 === 0 : year % 4 === 0;
  const daysByMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  const mm = parseInt(dateSplited[1]);
  const dd = parseInt(dateSplited[0]);
  if (dd > daysByMonth[mm - 1]) return false;

  return true;
};

export function cpfValidation(cpf) {
  if (!cpf) return false;

  // Remove tudo que não for número
  const cleanCpf = cpf.replace(/\D/g, '');

  // CPF precisa ter 11 dígitos
  if (cleanCpf.length !== 11) return false;

  // Elimina CPFs com todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  // =========================
  // Validação do 1º dígito
  // =========================
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }

  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;

  if (firstDigit !== parseInt(cleanCpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }

  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;

  if (secondDigit !== parseInt(cleanCpf.charAt(10))) return false;

  return true;
}

export const isDateGreaterThanOrEqualToToday = date => {
  const dateToCheck = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateToCheck.getTime() < today.getTime()) {
    return false;
  } else {
    return true;
  }
};

export function isValidationEmail(email){
   if (!email || typeof email !== 'string') {
    return false; 
  }
  const emailRegex = new RegExp(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    'i'
  );

  // .test() retorna true se houver uma correspondência, false caso contrário.
  return emailRegex.test(String(email).toLowerCase());
}