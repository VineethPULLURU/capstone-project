const allowedFields = (body: any, fields: string[]) => {
  const filteredBody: any = {};

  Object.keys(body).forEach((key) => {
    if (fields.includes(key)) {
      filteredBody[key] = body[key];
    }
  });

  return filteredBody;
};

module.exports = allowedFields;
