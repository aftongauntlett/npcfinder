import React from "react";

const FormInput = ({
  label,
  id,
  type = "text",
  required = false,
  className = "",
  ...props
}) => {
  const inputClasses =
    "mt-1 block w-full border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-surface text-text-primary";

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        required={required}
        className={inputClasses}
        {...props}
      />
    </div>
  );
};

export default FormInput;
