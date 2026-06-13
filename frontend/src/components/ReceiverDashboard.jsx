import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const academicClasses = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
const subjects = [
  "Sci-Fi",
  "Science",
  "Fiction",
  "Literature",
  "Mathematics",
  "Art",
  "History",
  "Other",
];

const ReceiverDashboard = ({ setCurrentUser }) => {
  // Sample data for demonstration purposes
  const [sampleBooks, setSampleBooks] = useState([]);

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("shop");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [requestCart, setRequestCart] = useState([]);
  const [requestedBooks, setRequestedBooks] = useState([]);
  const [session, setSession] = useState(null);

  const fetchBooks = async () => {
    // console.log("fetching");

    // const { data, error } = await supabase.from("books").select("*");
    const response = await fetch(
      import.meta.env.VITE_BACKEND_URL + "/getAllBooks",
    );
    const result = await response.json();
    
    if (!response.ok) {
      console.error("Error fetching books:", error);
    } else {
      console.log(result);
      setSampleBooks(result);
      console.log("sample books");
      console.log(sampleBooks);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);

      // console.log(session);

      const updateUser = async () => {
        //   const datas = await supabase.auth.getUser();
        // if (datas?.data?.user) {
        //   setCurrentUser(datas.data.user);
        // }

        // const { data, error } = await supabase.from("users").insert([
        //   {
        //     id: session?.user?.id,
        //     email: session?.user?.email,
        //     name: session?.user?.user_metadata?.name,
        //   },
        // ]);

        const response = await fetch(import.meta.env.VITE_BACKEND_URL+"/insertUser", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: session?.user?.id,
            email: session?.user?.email,
            name: session?.user?.user_metadata?.name,
          })
        },
      )

        if (!response.ok) {
          const result = await response.json();
          console.error("Error inserting user:", result.message);
        } else {
          console.log("User upserted successfully:", data);
        }
      };

      updateUser();
      if (!session?.user) {
        navigate("/");
      }
      fetchBooks();
    });

    supabase.auth.updateUser({
      data: {
        role: "receiver",
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
    // console.log("signed out");
    navigate("/");
    console.log(error);
  };

  // Filter books based on search term and filters

  const filteredBooks = useMemo(() => {
    return sampleBooks.filter((book) => {
      const title = book.title?.toLowerCase() || "";
      const author = book.author?.toLowerCase() || "";
      const subject = book.subject?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();

      const matchesSearchTerm =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilters =
        (filterSubject === "" || subject === filterSubject) &&
        (filterClass === "" || academicclass === filterClass);

      return matchesSearchTerm && matchesFilters;
    });
  }, [sampleBooks, searchTerm, filterSubject, filterClass]);

  const handleRequestBook = (book) => {
    // This function is called when user clicks "Request Book" button to add to cart

    if (!requestCart.find((item) => item.id === book.id)) {
      setRequestCart([...requestCart, book]);
      console.log(book);
      // alert(`${book.title} has been added to your cart.`);
    } else {
      alert(`${book.title} is already in your cart.`);
    }
  };

  const handleRemoveFromCart = (bookId) => {
    setRequestCart(requestCart.filter((book) => book.id !== bookId));
  };

  const handleSubmitRequest = async () => {
    console.log("Function called");
    if (requestCart.length === 0) {
      alert("Your cart is empty. Add some books to request.");
      return;
    }
    // console.log(requestCart.map(item => item));

    const newRequestedBooks = requestCart.map((book, index) => ({
      receiver_name: session?.user?.user_metadata?.name,
      receiver_email: session?.user?.email,
      id: book.id,
      book_name: book.title,
      receiver_id: session?.user?.id,
      donor_id: book.donor_id,
      author: book.author,
    }));

    const response = await fetch(import.meta.env.VITE_BACKEND_URL+"/insertTransaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newRequestedBooks)
    });

    const result = await response.json();
    console.log(newRequestedBooks);
    // const { data, error } = await supabase
    //   .from("transactions")
    //   .insert(newRequestedBooks);


    if (!response.ok) {
      console.error("Error submitting request:", result.message);
      alert("There was an error submitting your request. Please try again.");
      return;
    } else {
      console.log("Request submitted successfully:", result.message);
    }
    setRequestedBooks([...requestedBooks, ...newRequestedBooks]);
    setRequestCart([]);
    setActiveTab("requested");
    fetchRequestedBooks();
    alert(
      `Your request for ${newRequestedBooks.length} book(s) has been submitted!`,
    );
  };

  const fetchRequestedBooks = async () => {
    // const { data, error } = await supabase
    //   .from("transactions")
    //   .select("*")
    //   .eq("receiver_id", session?.user?.id);
    const response = await fetch(import.meta.env.VITE_BACKEND_URL+"/fetchReqBooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: session?.user?.id
      })
    });
    const result = await response.json();

    if (!response.ok) {
      console.error("Error fetching requested books:", result.message);
    } else {
      console.log('Fetched requested books:', result.data);

      setRequestedBooks(result.data);
    }
  };

  const simulateAcceptance = (bookId) => {
    const updatedRequested = requestedBooks.map((book, index) => {
      if (book.id === bookId && book.status === "pending") {
        return {
          ...book,
          status: "accepted",
          donorContact: "donor.contact@example.com",
        };
      }
      return book;
    });
    setRequestedBooks(updatedRequested);
  };

  const tabs = [
    { id: "shop", label: "Book shop" },
    { id: "cart", label: `Request cart (${requestCart.length})` },
    { id: "requested", label: "Requested books" },
  ];

  const inputClass =
    "w-full px-4 py-2.5 bg-[#13110f] border border-[#3a352f] rounded-lg text-[#f1ece4] placeholder-[#6b635a] focus:outline-none focus:ring-2 focus:ring-[#d4a24e]/40 focus:border-[#d4a24e] transition-colors";
  const labelClass = "block text-sm font-medium text-[#cfc7bd] mb-1.5";

  const statusStyles = {
    pending: "text-[#e0b465] bg-[#2a2014] border border-[#4a3a1c]",
    declined: "text-[#f4b4ad] bg-[#2a1414] border border-[#4a201c]",
    accepted: "text-[#9fe0b0] bg-[#1d3322] border border-[#2c4430]",
  };

  return (
    <div className="min-h-screen bg-[#13110f] text-[#f1ece4] font-sans px-4 sm:px-8 py-10 [background:radial-gradient(ellipse_at_top,#1d1916_0%,#0f0d0b_60%)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#d4a24e] mb-2">
            receiver portal
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#f5f1ec]">
            Receiver dashboard
          </h1>
          <p className="text-sm text-[#a39a8f] mt-1.5">
            Browse donated books, build a request, and track where things stand.
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
              onClick={() => {
                if (tab.id === "shop") fetchBooks();
                if (tab.id === "requested") fetchRequestedBooks();
                setActiveTab(tab.id);
              }}
              className={`relative pb-3 -mb-px text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#d4a24e] text-[#d4a24e]"
                  : "border-transparent text-[#a39a8f] hover:text-[#f1ece4]"
              }`}
            >
              {tab.label}
              {tab.id === "cart" && requestCart.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-[#1c1410] bg-[#d4a24e] rounded-full align-middle">
                  {requestCart.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-[#1c1917] border border-[#2e2a26] rounded-2xl p-6 sm:p-8">
          {activeTab === "shop" && (
            <div>
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search by title, author, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={inputClass}
                />
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full sm:w-auto px-4 py-2.5 text-[#cfc7bd] border border-[#3a352f] rounded-lg font-medium hover:bg-[#2a241f] transition-colors whitespace-nowrap"
                >
                  {showFilters ? "Hide filters" : "Filter books"}
                </button>
              </div>

              {showFilters && (
                <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border border-[#2e2a26] rounded-xl bg-[#161412]">
                  <div className="w-full sm:w-1/2">
                    <label className={labelClass}>Subject</label>
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">All subjects</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className={labelClass}>Academic class</label>
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">All classes</option>
                      {academicClasses.map((ac) => (
                        <option key={ac} value={ac}>
                          {ac}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book) => {
                    const inCart = !!requestCart.find(
                      (item) => item.id === book.id,
                    );
                    return (
                      <div
                        key={book.id}
                        className="bg-[#161412] border border-[#2e2a26] rounded-xl overflow-hidden flex flex-col items-center p-4 hover:border-[#3a352f] transition-colors"
                      >
                        <img
                          src={book.book_img_url}
                          alt={book.title}
                          className="w-3/4 h-45 max-h-56 object-contain rounded-md mb-4 bg-[#0f0d0b]"
                        />

                        <div className="text-center w-full flex-grow space-y-1.5">
                          <h3 className="text-base font-semibold text-[#f5f1ec] line-clamp-2">
                            {book.title}
                          </h3>
                          <p className="text-sm text-[#a39a8f]">
                            by{" "}
                            <span className="text-[#cfc7bd]">
                              {book.author}
                            </span>
                          </p>
                          <p className="text-xs text-[#6b635a] line-clamp-1">
                            {book.subject} · Class {book.academicclass}
                          </p>
                        </div>

                        <div className="mt-4 w-full">
                          <button
                            onClick={() => handleRequestBook(book)}
                            disabled={inCart}
                            className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a24e]/40 ${
                              inCart
                                ? "bg-[#2a241f] text-[#9fe0b0] cursor-default"
                                : "bg-[#d4a24e] text-[#1c1410] hover:bg-[#e0b465]"
                            }`}
                          >
                            {inCart ? "Requested ✓" : "Request book"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[#a39a8f] text-center col-span-full">
                    No books found matching your criteria.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "cart" && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-semibold text-[#f5f1ec]">
                Your request cart
              </h2>
              {requestCart.length > 0 ? (
                <>
                  <ul className="space-y-2">
                    {requestCart.map((book) => (
                      <li
                        key={book.id}
                        className="flex items-center justify-between p-3 border border-[#2e2a26] rounded-lg bg-[#161412]"
                      >
                        <span className="font-medium text-[#f1ece4]">
                          {book.title}
                        </span>
                        <button
                          onClick={() => handleRemoveFromCart(book.id)}
                          className="px-3 py-1 text-xs font-medium text-[#f4b4ad] border border-[#4a201c] bg-[#2a1414] rounded-md hover:bg-[#3a1a16] transition-colors"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 text-right">
                    <button
                      onClick={() => {
                        handleSubmitRequest();
                      }}
                      className="px-6 py-2.5 bg-[#d4a24e] text-[#1c1410] font-semibold rounded-lg shadow-sm hover:bg-[#e0b465] focus:outline-none focus:ring-2 focus:ring-[#d4a24e]/40 transition-colors"
                    >
                      Submit request
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-[#a39a8f]">Your request cart is empty.</p>
              )}
            </div>
          )}

          {activeTab === "requested" && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-semibold text-[#f5f1ec]">
                Your requested books
              </h2>
              {requestedBooks.length > 0 ? (
                <div className="space-y-3">
                  {requestedBooks.map((book) => (
                    <div
                      key={book.id}
                      className="p-4 border border-[#2e2a26] rounded-xl flex justify-between items-center bg-[#161412] hover:border-[#3a352f] transition-colors"
                    >
                      <div>
                        <p className="font-medium text-[#f5f1ec]">
                          {book.book_name}
                        </p>
                        <p className="text-sm text-[#a39a8f]">
                          Author: {book.author}
                        </p>
                        <span
                          className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${statusStyles[book.status] || statusStyles.pending}`}
                        >
                          {book.status}
                        </span>
                        {book.status === "accepted" && (
                          <div className="mt-2 text-sm text-[#cfc7bd]">
                            <p>
                              Contact donor:{" "}
                              <span className="font-semibold text-[#d4a24e]">
                                {book.donor_email}
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-[#6b635a] italic">
                              Contact the donor to arrange for pickup or
                              delivery.
                            </p>
                          </div>
                        )}
                      </div>
                      {book.status === "pending" && (
                        <button
                          onClick={() => simulateAcceptance(book.id)}
                          className="px-4 py-2 text-sm font-medium text-[#9fe0b0] bg-[#1d3322] border border-[#2c4430] rounded-lg hover:bg-[#27432c] transition-colors"
                        >
                          Simulate accept
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#a39a8f]">
                  You have not requested any books yet.
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

export default ReceiverDashboard;
