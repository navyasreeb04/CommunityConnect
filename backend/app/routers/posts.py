from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.dependencies import get_current_user, get_db
from app.models import Comment, Community, Post, PostLike, User, UserCommunity
from app.schemas import CommentCreate, CommentRead, PostCreate, PostRead


router = APIRouter(prefix="/posts", tags=["posts"])


def _serialize_post(post: Post, current_user: User, memberships: dict[int, UserCommunity]) -> PostRead:
    membership = memberships.get(post.community_id)
    liked_by_me = any(like.user_id == current_user.id for like in post.likes)
    comments = [
        CommentRead(
            id=comment.id,
            content=comment.content,
            created_at=comment.created_at,
            author_name=comment.author.full_name,
            author_id=comment.author.id,
        )
        for comment in sorted(post.comments, key=lambda item: item.created_at)
    ]
    return PostRead(
        id=post.id,
        title=post.title,
        content=post.content,
        created_at=post.created_at,
        community_id=post.community.id,
        community_name=post.community.name,
        community_color=post.community.color,
        author_id=post.author.id,
        author_name=post.author.full_name,
        like_count=len(post.likes),
        comment_count=len(post.comments),
        liked_by_me=liked_by_me,
        priority=membership.priority if membership else None,
        is_joined_community=membership is not None,
        comments=comments,
    )


@router.get("/feed", response_model=list[PostRead])
def get_feed(
    community_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memberships = db.scalars(select(UserCommunity).where(UserCommunity.user_id == current_user.id)).all()
    membership_map = {membership.community_id: membership for membership in memberships}

    query = (
        select(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.community),
            selectinload(Post.comments).selectinload(Comment.author),
            selectinload(Post.likes),
        )
        .order_by(Post.created_at.desc())
    )
    if community_id is not None:
        query = query.where(Post.community_id == community_id)

    posts = db.scalars(query).all()
    serialized_posts = [_serialize_post(post, current_user, membership_map) for post in posts]
    serialized_posts.sort(
        key=lambda item: (
            0 if item.is_joined_community else 1,
            item.priority if item.priority is not None else 999,
            -item.created_at.timestamp(),
            -item.like_count,
        )
    )
    return serialized_posts


@router.post("", response_model=PostRead, status_code=status.HTTP_201_CREATED)
def create_post(payload: PostCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    community = db.get(Community, payload.community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found.")

    post = Post(title=payload.title, content=payload.content, user_id=current_user.id, community_id=payload.community_id)
    db.add(post)
    db.commit()
    db.refresh(post)

    memberships = db.scalars(select(UserCommunity).where(UserCommunity.user_id == current_user.id)).all()
    post = db.scalar(
        select(Post)
        .where(Post.id == post.id)
        .options(
            selectinload(Post.author),
            selectinload(Post.community),
            selectinload(Post.comments).selectinload(Comment.author),
            selectinload(Post.likes),
        )
    )
    membership_map = {membership.community_id: membership for membership in memberships}
    return _serialize_post(post, current_user, membership_map)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found.")
    if current_user.role != "admin" and post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot delete this post.")

    db.delete(post)
    db.commit()


@router.post("/{post_id}/like", status_code=status.HTTP_201_CREATED)
def like_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found.")

    existing_like = db.scalar(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    )
    if existing_like:
        raise HTTPException(status_code=400, detail="You already liked this post.")

    like = PostLike(post_id=post_id, user_id=current_user.id)
    db.add(like)
    db.commit()
    return {"message": "Post liked."}


@router.delete("/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing_like = db.scalar(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    )
    if existing_like is None:
        raise HTTPException(status_code=404, detail="Like not found.")

    db.delete(existing_like)
    db.commit()


@router.post("/{post_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found.")

    comment = Comment(post_id=post_id, user_id=current_user.id, content=payload.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return CommentRead(
        id=comment.id,
        content=comment.content,
        created_at=comment.created_at,
        author_name=current_user.full_name,
        author_id=current_user.id,
    )


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found.")
    if current_user.role != "admin" and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot delete this comment.")

    db.delete(comment)
    db.commit()
