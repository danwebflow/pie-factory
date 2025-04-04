const formSubmitEvent = (function () {
  const init = ({ onlyWorkOnThisFormName, onSuccess, onFail }) => {
    $(document).ajaxComplete((event, xhr, settings) => {
      if (!settings.url.includes("https://webflow.com/api/v1/form/")) return;

      const isSuccessful = xhr.status === 200;
      const isWorkOnAllForms = !onlyWorkOnThisFormName;
      const isCorrectForm = isWorkOnAllForms || settings.data.includes(
        getSanitizedFormName(onlyWorkOnThisFormName));

      if (isCorrectForm) {
        isSuccessful ? onSuccess() : onFail();
      }
    });
  };

  const getSanitizedFormName = (name) => name.replace(/\s+/g, "+");

  return { init };
})();

formSubmitEvent.init({
  onlyWorkOnThisFormName: "Example Form",
  onSuccess: () => {
    const formSuccessElement = document.querySelector('.form-success');
    if (formSuccessElement) {
      formSuccessElement.remove();
    }

    const introductionSection = document.getElementById('section-introduction');
    if (introductionSection) {
      introductionSection.classList.remove("hide");
      introductionSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.error("Element with ID 'section-introduction' not found.");
    }
  },
  onFail: () => {
    alert("A form with this name 'Example Form' is : Fail");
  }
});
