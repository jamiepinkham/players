import React, { useEffect, useState } from "react";

import axios from "axios";

import PostCard from "../components/PostCard";

function PostList() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    const source = axios.CancelToken.source();
    axios
      .get(
        "https://billymartinplayersleague.com/ghost/api/v3/content/posts/?key=d78a1417d45184b19f61172788&include=tags,authors",
        {
          cancelToken: source.token,
        }
      )
      .then((response) => {
        setPosts(response.data.posts);
      });
    return () => {
      source.cancel();
    };
  }, [setPosts]);
  return (
    <div id="content">
      {posts.map((post, index) => (
        <div key={post.slug}>
          <PostCard
            link={post.url}
            cover={post.feature_image}
            title={post.title}
            date={post.published_at}
            excerpt={post.excerpt}
          />
        </div>
      ))}
    </div>
  );
}

export default PostList;
