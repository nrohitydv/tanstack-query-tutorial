import { Link, useNavigate, useParams } from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchEvent, updateEvent } from "../../util/http.js";
import { queryClient } from "../../util/http.js";
export default function EditEvent() {
  const navigate = useNavigate();
  const params = useParams();
  const { data, isPending, isError } = useQuery({
    queryKey: ["events", { id: params.id }],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
  });
  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => {
      const newEvent = data.event;
      //to cancel queries
      await queryClient.cancelQueries({
        queryKey: ["events", { id: params.id }],
      });
      //to roll back to previus data
      const previousEvent = queryClient.getQueryData([
        "events",
        { id: params.id },
      ]);
      queryClient.setQueryData(["events", { id: params.id }], newEvent);
      return { previousEvent };
    },
    onError: (error, event, context) => {
      queryClient.setQueryData(
        ["events", { id: params.id }],
        context.previousEvent
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries(["events", params.id]);
    },
  });
  function handleSubmit(formData) {
    mutate({ event: formData, id: params.id });
    navigate("../");
  }

  function handleClose() {
    navigate("../");
  }
  let content;
  if (isPending) {
    content = <p>Loading...</p>;
  }
  if (isError) {
    content = (
      <>
        <p>Error fetching data...</p>
        <Link to="../">Okay</Link>
      </>
    );
  }
  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        <Link to="../" className="button-text">
          Cancel
        </Link>
        <button type="submit" className="button">
          Update
        </button>
      </EventForm>
    );
  }
  return <Modal onClose={handleClose}>{content}</Modal>;
}
