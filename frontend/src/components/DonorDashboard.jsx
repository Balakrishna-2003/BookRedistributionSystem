import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const DonorDashboard = ({ setCurrentUser }) => {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    subject: "",
    academicclass: "",
    edition: "",
    publisher: "",
    description: "",
    donatoremail: "",
    donor_id: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setFormData({ ...formData, donor_id: session?.user?.id });

      const updateUser = async () => {
        const { data, error } = await supabase.from("users").insert([
          {
            id: session?.user?.id,
            email: session?.user?.email,
            name: session?.user?.user_metadata?.name,
          },
        ]);
        if (error) {
          console.error("Error upserting user:", error);
        } else {
          console.log("User upserted successfully:", data);
        }
      };

      updateUser();
      if (!session?.user) {
        navigate("/");
      }
    });
    supabase.auth.updateUser({
      data: {
        role: "donor",
      },
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
    console.log("signed out");
    navigate("/");
    console.log(error);
  };

  const [activeTab, setActiveTab] = useState("donate");

  //   title text not null, done
  // --   author text, done
  // --  subject text, done
  // --  academicclass text, done
  // --  Edition text, done
  // --  publisher text, done
  // --   description text,  done
  // --   donor_id uuid,

  const [coverImage, setCoverImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [addedBook, setAddedBook] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showFailureMessage, setShowFailureMessage] = useState(false);
  const [failureReason, setFailureReason] = useState("");

  // Sample data for books and requests
  const [myBooks, setMyBooks] = useState([]);

  const fetchBooks = async () => {
    // console.log("fetching");

    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("donor_id", session?.user?.id);
    if (error) {
      console.error("Error fetching books:", error);
    } else {
      // console.log('fd');

      setMyBooks(data);
    }
  };

  const [requests, setRequests] = useState([
    // {
    //   id: 1,
    //   bookTitle: "The Great Gatsby",
    //   receiverName: "Jane Doe",
    //   receiverEmail: "jane.doe@example.com",
    //   status: "pending"
    // },
    // {
    //   id: 2,
    //   bookTitle: "To Kill a Mockingbird",
    //   receiverName: "John Smith",
    //   receiverEmail: "john.smith@example.com",
    //   status: "pending"
    // }
  ]);

  const fetchRequestedBooks = async () => {
    // console.log("fetching");

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("donor_id", session?.user?.id);
    if (error) {
      console.error("Error fetching books:", error);
    } else {
      // console.log('fd');
      try {
        const pendingItems = data.filter((item) => item.status === "pending");
        const otherItems = data.filter((item) => item.status !== "pending");

        const sortedData = [...pendingItems, ...otherItems].map(
          (item, index) => ({
            key: item.u_id,
            ...item,
          }),
        );
        setRequests(sortedData);
        // console.log("requests");

        // console.log(sortedData);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(e.target.files[0]);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  // --  title text not null,
  // --   author text,
  // --  subject text,
  // --  academicclass text,
  // --  Edition text,
  // --  publisher text,
  // --   description text,
  // --   donor_id uuid,
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Upload file using standard upload
    async function uploadFile(file) {
      console.log(file.lastModifiedDate);
      setLoading(true);
      const datas = await supabase.storage
        .from("book-covers")
        .upload(`${Date.now()}-${file.name}`, file);

      if (datas.error) {
        console.log("error");
        console.log(datas.error);
        setLoading(false);
        setFailureReason("Failed to upload the cover image. Please try again.");
        setShowFailureMessage(true);
        setTimeout(() => setShowFailureMessage(false), 5000);
        return;
      } else {
        // Handle success
        console.log("file uploaded");

        console.log(
          import.meta.env.VITE_SUPABASE_URL +
            "/storage/v1/object/public/images/" +
            datas.data.path,
        );

        try {
          const response = await fetch(
            import.meta.env.VITE_BACKEND_URL + "/data",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title: formData.title,
                author: formData.author,
                subject: formData.subject,
                academicclass: formData.academicclass,
                edition: formData.edition,
                publisher: formData.publisher,
                description: formData.description,
                donor_id: formData.donor_id,
                book_img_url:
                  import.meta.env.VITE_SUPABASE_URL +
                  "/storage/v1/object/public/book-covers/" +
                  datas.data.path,
              }),
            },
          );

          console.log(response);
          if (response.ok) {
            setLoading(false);
            setShowSuccessMessage(true);
            // Hide the message after a few seconds
            setTimeout(() => {
              setShowSuccessMessage(false);
              // Reset the form
              setFormData((prev) => ({
                title: "",
                author: "",
                subject: "",
                academicclass: "",
                edition: "",
                publisher: "",
                description: "",
                donatoremail: "",
                donor_id: prev.donor_id,
              }));
              setCoverImage(null);
              setImagePreviewUrl(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }, 5000);
          } else {
            setLoading(false);
            setFailureReason(
              "Could not save the book details. Please try again.",
            );
            setShowFailureMessage(true);
            setTimeout(() => {
              setShowFailureMessage(false);
              // Reset the form
              setFormData((prev) => ({
                title: "",
                author: "",
                subject: "",
                academicclass: "",
                edition: "",
                publisher: "",
                description: "",
                donatoremail: "",
                donor_id: prev.donor_id,
              }));
              setCoverImage(null);
              setImagePreviewUrl(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }, 5000);
          }
        } catch (error) {
          console.log(error);
          setLoading(false);
          setFailureReason("Something went wrong while adding the book.");
          setShowFailureMessage(true);
          setTimeout(() => setShowFailureMessage(false), 5000);
        }

        // const { data, error } = await supabase.from('books').insert(
        //   [{
        //     title: formData.title,
        //     author: formData.author,
        //     subject: formData.subject,
        //     academicclass: formData.academicclass,
        //     edition: formData.edition,
        //     publisher: formData.publisher,
        //     description: formData.description,
        //     donor_id: formData.donor_id,
        //     book_img_url: import.meta.env.VITE_SUPABASE_URL+"/storage/v1/object/public/book-covers/" + datas.data.path
        //   }]
        // );
        // console.log(data, error);

        // setTimeout(() => {
        // setLoading(false);
        // const newBook = {
        //   title: formData.title,
        //   author: formData.author,
        //   subject: formData.subject,
        // };
        // setMyBooks([...myBooks, newBook]); // Add the new book to the list
        // setAddedBook(newBook); // Set the book for the confirmation message
        // setShowSuccessMessage(true);

        // console.log(formData);

        // Hide the message after a few seconds
        // setTimeout(() => setShowSuccessMessage(false), 5000);

        // Reset the form
        // setFormData((prev) => ({
        //   title: "",
        //   author: "",
        //   subject: "",
        //   academicclass: "",
        //   edition: "",
        //   publisher: "",
        //   description: "",
        //   donatoremail: "",
        //   donor_id: prev.donor_id,
        // }));
        // setCoverImage(null);
        // setImagePreviewUrl(null);
        // }, 1500);
      }
    }
    uploadFile(coverImage);
  };

  const handleRemoveBook = (id) => {
    setMyBooks(myBooks.filter((book) => book.id !== id));
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleAccept = async (request, id) => {
    // console.log(request);

    // const { data, error } = await supabase
    //   .from("transactions")
    //   .update({
    //     status: "accepted",
    //     donor_email: session?.user?.user_metadata?.email,
    //   })
    //   .eq("receiver_id", request.receiver_id)
    //   .eq("id", id);

    const response = await fetch(
      import.meta.env.VITE_BACKEND_URL + "/acceptReq",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session?.user?.user_metadata?.email,
          receiver_id: request.receiver_id,
          id: id,
        }),
      },
    );

    setRequests(
      requests.map((req, index) =>
        req.receiver_id === request.receiver_id && req.id === id
          ? { ...req, key: index, status: "accepted" }
          : req,
      ),
    );
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const handleDecline = async (receiver_id, id) => {
    // const { data, error } = await supabase
    //   .from("transactions")
    //   .update({
    //     status: "declined",
    //     donor_email: session?.user?.user_metadata?.email,
    //   })
    //   .eq("receiver_id", receiver_id)
    //   .eq("id", id);

    const response = await fetch(
      import.meta.env.VITE_BACKEND_URL + "/declineReq",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session?.user?.user_metadata?.email,
          receiver_id: receiver_id,
          id: id,
        }),
      },
    );

    setRequests(
      requests.map((req, index) =>
        req.receiver_id === receiver_id && req.id === id
          ? { ...req, key: index, status: "declined" }
          : req,
      ),
    );
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);

    // setRequests(requests.filter(req => req.id !== id));
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const academicclasses = Array.from({ length: 10 }, (_, i) => i + 1);
  const subjects = [
    "Science",
    "Mathematics",
    "History",
    "Literature",
    "Art",
    "Other",
  ];

  const tabs = [
    { id: "donate", label: "Add a book" },
    { id: "myBooks", label: "My books" },
    { id: "requests", label: "Book requests" },
  ];

  const inputClass =
    "w-full px-3 py-2.5 bg-[#13110f] border border-[#3a352f] rounded-lg text-[#f1ece4] placeholder-[#6b635a] focus:outline-none focus:ring-2 focus:ring-[#d4a24e]/40 focus:border-[#d4a24e] transition-colors";
  const labelClass = "block text-sm font-medium text-[#cfc7bd] mb-1.5";

  return (
    <div className="min-h-screen bg-[#13110f] text-[#f1ece4] font-sans px-4 sm:px-8 py-10 [background:radial-gradient(ellipse_at_top,#1d1916_0%,#0f0d0b_60%)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#d4a24e] mb-2">
            donor portal
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#f5f1ec]">
            Donor dashboard
          </h1>
          <p className="text-sm text-[#a39a8f] mt-1.5">
            Share books, track requests, and help them find a new reader.
          </p>
        </div>

        {/* Profile bar */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-[#2e2a26] bg-[#1c1917] mb-8">
          <div className="flex-shrink-0">
            {!session?.user?.user_metadata?.picture ? (
              <div className="w-10 h-10 rounded-full bg-[#2a241f] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-[#d4a24e]"
                >
                  <path d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
            ) : (
              <img
                src={session?.user?.user_metadata?.picture}
                alt="profile"
                className="w-10 h-10 rounded-full bg-[#2a241f]"
              />
            )}
          </div>
          <div className="flex-grow">
            <p className="text-sm font-semibold text-[#f5f1ec]">
              {session?.user?.user_metadata?.name}
            </p>
            <p className="text-xs text-[#a39a8f]">
              {session?.user?.user_metadata?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm font-medium text-[#f4b4ad] bg-[#2a1414] border border-[#4a201c] rounded-full hover:bg-[#3a1a16] transition-colors"
          >
            Log out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-[#2e2a26] mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`pb-3 -mb-px text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#d4a24e] text-[#d4a24e]"
                  : "border-transparent text-[#a39a8f] hover:text-[#f1ece4]"
              }`}
              onClick={() => {
                if (tab.id === "myBooks") fetchBooks();
                if (tab.id === "requests") fetchRequestedBooks();
                setActiveTab(tab.id);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-[#1c1917] border border-[#2e2a26] rounded-2xl p-6 sm:p-8">
          {activeTab === "donate" ? (
            <>
              {showSuccessMessage && (
                <div className="bg-[#16241a] border border-[#2c4430] text-[#bfe6c8] px-4 py-3 rounded-xl relative mb-6">
                  <p className="font-semibold text-[#9fe0b0]">Success!</p>
                  <p className="text-sm mt-0.5">
                    You added{" "}
                    <strong className="font-semibold text-[#f1ece4]">
                      "{formData?.title}"
                    </strong>{" "}
                    to your list.
                  </p>
                  <div className="mt-2 text-sm text-[#9fb8a3] space-y-0.5">
                    <p>
                      <span className="text-[#bfe6c8]">Author:</span>{" "}
                      {formData?.author}
                    </p>
                    <p>
                      <span className="text-[#bfe6c8]">Subject:</span>{" "}
                      {formData?.subject}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSuccessMessage(false)}
                    className="absolute top-3 right-3 text-[#9fe0b0] hover:text-[#bfe6c8]"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <title>Close</title>
                      <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15L5.651 4.348a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.03a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.15L14.348 14.849z" />
                    </svg>
                  </button>
                </div>
              )}
              {showFailureMessage && (
                <div className="bg-[#2a1414] border border-[#4a201c] text-[#f4b4ad] px-4 py-3 rounded-xl relative mb-6">
                  <p className="font-semibold text-[#f4b4ad]">
                    Something went wrong
                  </p>
                  <p className="text-sm mt-0.5">
                    {failureReason ||
                      "We couldn't add your book. Please try again."}
                  </p>
                  <button
                    onClick={() => setShowFailureMessage(false)}
                    className="absolute top-3 right-3 text-[#f4b4ad] hover:text-[#fcd6d1]"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <title>Close</title>
                      <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15L5.651 4.348a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.03a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.15L14.348 14.849z" />
                    </svg>
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="font-serif text-xl font-semibold text-[#f5f1ec]">
                  Add book details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Author</label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Subject / genre</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Academic class</label>
                    <select
                      name="academicclass"
                      value={formData.academicclass}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select a class</option>
                      {academicclasses.map((ac) => (
                        <option key={ac} value={ac}>
                          {ac}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Edition</label>
                    <input
                      type="text"
                      name="edition"
                      value={formData.edition}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Publisher</label>
                    <input
                      type="text"
                      name="publisher"
                      value={formData.publisher}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Brief description</label>
                    <textarea
                      name="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    ></textarea>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Your contact email</label>
                    <input
                      type="email"
                      name="donatoremail"
                      value={formData.donatoremail}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Book cover image</label>
                    <div className="flex items-start gap-4">
                      {imagePreviewUrl && (
                        <img
                          src={imagePreviewUrl}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg border border-[#3a352f]"
                        />
                      )}
                      <input
                        id="bookImage"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        required
                        onChange={handleImageChange}
                        className="block w-full max-w-xs text-sm text-[#a39a8f] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2a241f] file:text-[#d4a24e] hover:file:bg-[#332c25] file:transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#d4a24e] text-[#1c1410] font-semibold rounded-lg shadow-sm hover:bg-[#e0b465] focus:outline-none focus:ring-2 focus:ring-[#d4a24e]/40 disabled:bg-[#6b5a3a] disabled:text-[#cfc7bd] transition-colors"
                    disabled={loading}
                  >
                    {loading ? "Adding…" : "Add book"}
                  </button>
                </div>
              </form>
            </>
          ) : activeTab === "myBooks" ? (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-semibold text-[#f5f1ec]">
                My books
              </h2>
              {myBooks.length > 0 ? (
                <div className="space-y-3">
                  {myBooks.map((book) => (
                    <div
                      key={book.id}
                      className="p-4 rounded-xl border border-[#2e2a26] bg-[#161412] flex justify-between items-center hover:border-[#3a352f] transition-colors"
                    >
                      <div>
                        <p className="font-medium text-[#f5f1ec]">
                          {book.title}
                        </p>
                        <p className="text-sm text-[#a39a8f]">
                          by {book.author}
                        </p>
                        {book.created_at && (
                          <p className="text-xs text-[#6b635a] mt-0.5">
                            Added {book.created_at}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveBook(book.id)}
                        className="px-4 py-2 text-sm font-medium text-[#f4b4ad] bg-[#2a1414] border border-[#4a201c] rounded-lg hover:bg-[#3a1a16] transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#a39a8f]">
                  You haven't added any books yet.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="font-serif text-xl font-semibold text-[#f5f1ec]">
                Incoming book requests
              </h2>
              {requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div
                      key={request.u_id}
                      className="p-4 rounded-xl border border-[#2e2a26] bg-[#161412] flex justify-between items-center hover:border-[#3a352f] transition-colors"
                    >
                      <div>
                        <p className="font-medium text-[#f5f1ec]">
                          {request?.book_name}
                        </p>
                        <p className="text-sm text-[#a39a8f]">
                          Requested by{" "}
                          <span className="text-[#cfc7bd] font-medium">
                            {request.receiver_name}
                          </span>
                        </p>
                        {request.status === "accepted" && (
                          <p className="text-sm mt-1 text-[#9fe0b0]">
                            Receiver contact: {request.receiver_email}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === "pending" ? (
                          <>
                            <button
                              onClick={() => handleAccept(request, request.id)}
                              className="px-4 py-2 text-sm font-medium text-[#9fe0b0] bg-[#1d3322] border border-[#2c4430] rounded-lg hover:bg-[#27432c] transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                handleDecline(request.receiver_id, request.id)
                              }
                              className="px-4 py-2 text-sm font-medium text-[#f4b4ad] bg-[#2a1414] border border-[#4a201c] rounded-lg hover:bg-[#3a1a16] transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <span
                            className={
                              request.status === "accepted"
                                ? "text-xs font-medium text-[#9fe0b0] bg-[#1d3322] border border-[#2c4430] px-3 py-1 rounded-full"
                                : "text-xs font-medium text-[#f4b4ad] bg-[#2a1414] border border-[#4a201c] px-3 py-1 rounded-full"
                            }
                          >
                            {request.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#a39a8f]">
                  No new book requests at this time.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        .font-serif { font-family: 'Source Serif 4', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
};

export default DonorDashboard;
