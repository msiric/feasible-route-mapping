export const handleThrownException = (err) => {
  const exception = err.response.data;
  return {
    status: exception.status_code,
    error: exception.error,
  };
};
